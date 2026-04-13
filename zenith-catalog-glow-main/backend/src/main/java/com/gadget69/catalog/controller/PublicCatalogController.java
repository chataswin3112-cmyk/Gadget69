package com.gadget69.catalog.controller;

import com.gadget69.catalog.dto.ApiDtos;
import com.gadget69.catalog.entity.CustomerOrder;
import com.gadget69.catalog.entity.OrderItem;
import com.gadget69.catalog.entity.Product;
import com.gadget69.catalog.mapper.CatalogMapper;
import com.gadget69.catalog.repository.BannerRepository;
import com.gadget69.catalog.repository.CommunityMediaRepository;
import com.gadget69.catalog.repository.CustomerOrderRepository;
import com.gadget69.catalog.repository.ProductRepository;
import com.gadget69.catalog.repository.SectionRepository;
import com.gadget69.catalog.repository.StoreSettingsRepository;
import com.gadget69.catalog.service.ProductPricingService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PublicCatalogController {

  private final SectionRepository sectionRepository;
  private final ProductRepository productRepository;
  private final BannerRepository bannerRepository;
  private final StoreSettingsRepository storeSettingsRepository;
  private final CommunityMediaRepository communityMediaRepository;
  private final CustomerOrderRepository customerOrderRepository;
  private final CatalogMapper catalogMapper;
  private final ProductPricingService productPricingService;

  @GetMapping("/health")
  public Map<String, Object> health() {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("status", "UP");
    response.put("service", "gadget69-catalog-backend");
    return response;
  }

  @GetMapping("/sections")
  public List<ApiDtos.SectionResponse> sections() {
    return sectionRepository.findAllByOrderBySortOrderAscNameAsc().stream()
        .map(catalogMapper::toSectionResponse)
        .toList();
  }

  @GetMapping("/products")
  public List<ApiDtos.ProductResponse> products() {
    return productRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc().stream()
        .map(catalogMapper::toProductResponse)
        .toList();
  }

  @GetMapping("/products/{id}")
  public ApiDtos.ProductResponse product(@PathVariable Long id) {
    Product product = productRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    return catalogMapper.toProductResponse(product);
  }

  @GetMapping("/banners")
  public List<ApiDtos.BannerResponse> banners() {
    return bannerRepository.findAllByIsActiveTrueOrderByDisplayOrderAscIdAsc().stream()
        .map(catalogMapper::toBannerResponse)
        .toList();
  }

  @GetMapping("/settings")
  public ApiDtos.SettingsResponse settings() {
    return catalogMapper.toSettingsResponse(storeSettingsRepository.findTopByOrderByIdAsc()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Settings not found")));
  }

  @GetMapping("/community-media")
  public List<ApiDtos.CommunityMediaResponse> communityMedia() {
    return communityMediaRepository.findAllByIsActiveTrueOrderByDisplayOrderAscIdAsc().stream()
        .map(catalogMapper::toCommunityMediaResponse)
        .toList();
  }

  @PostMapping("/create-order")
  public ApiDtos.OrderResponse createOrder(@RequestBody ApiDtos.CreateOrderRequest request) {
    if (request == null || request.items() == null || request.items().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order items are required");
    }

    CustomerOrder order = new CustomerOrder();
    order.setCustomerName(requiredValue(request.customerName(), "Customer name is required"));
    order.setPhone(requiredValue(request.phone(), "Phone number is required"));
    order.setAddress(requiredValue(request.address(), "Address is required"));
    order.setPincode(requiredValue(request.pincode(), "Pincode is required"));
    order.setPaymentStatus(request.paymentStatus() == null || request.paymentStatus().isBlank()
        ? "PENDING"
        : request.paymentStatus().trim().toUpperCase());
    order.setRazorpayOrderId("G69-ORDER-" + System.currentTimeMillis());

    BigDecimal totalAmount = BigDecimal.ZERO;
    for (ApiDtos.OrderItemPayload itemPayload : request.items()) {
      if (itemPayload.productId() == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product id is required");
      }

      Product product = productRepository.findById(itemPayload.productId())
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product not found"));
      int quantity = normalizeQuantity(itemPayload.quantity());
      BigDecimal unitPrice = productPricingService.resolveEffectivePrice(product, LocalDate.now());

      OrderItem orderItem = new OrderItem();
      orderItem.setOrder(order);
      orderItem.setProductId(product.getId());
      orderItem.setProductName(product.getName());
      orderItem.setQuantity(quantity);
      orderItem.setPrice(unitPrice);
      order.getItems().add(orderItem);

      totalAmount = totalAmount.add(unitPrice.multiply(BigDecimal.valueOf(quantity)));
    }

    order.setTotalAmount(totalAmount);
    return catalogMapper.toOrderResponse(customerOrderRepository.save(order));
  }

  @PostMapping("/verify-payment")
  public ApiDtos.OrderResponse verifyPayment(@RequestBody ApiDtos.PaymentVerifyRequest request) {
    CustomerOrder order = customerOrderRepository.findById(request.orderId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    order.setPaymentStatus("PAID");
    order.setRazorpayPaymentId(request.razorpayPaymentId());
    order.setRazorpayOrderId(request.razorpayOrderId());
    return catalogMapper.toOrderResponse(customerOrderRepository.save(order));
  }

  private String requiredValue(String value, String message) {
    if (value == null || value.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
    return value.trim();
  }

  private int normalizeQuantity(Integer quantity) {
    if (quantity == null) {
      return 1;
    }
    if (quantity <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be at least 1");
    }
    return quantity;
  }
}
