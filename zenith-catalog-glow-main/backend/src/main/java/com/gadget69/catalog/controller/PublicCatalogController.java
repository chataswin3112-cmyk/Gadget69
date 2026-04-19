package com.gadget69.catalog.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.gadget69.catalog.config.InputSanitizer;
import com.gadget69.catalog.dto.ApiDtos;
import com.gadget69.catalog.entity.CustomerOrder;
import com.gadget69.catalog.entity.OrderItem;
import com.gadget69.catalog.entity.Product;
import com.gadget69.catalog.mapper.CatalogMapper;
import com.gadget69.catalog.repository.BannerRepository;
import com.gadget69.catalog.repository.CommunityMediaRepository;
import com.gadget69.catalog.repository.CustomerOrderRepository;
import com.gadget69.catalog.repository.ProductRepository;
import com.gadget69.catalog.repository.ProductVariantRepository;
import com.gadget69.catalog.repository.ReviewRepository;
import com.gadget69.catalog.repository.SectionRepository;
import com.gadget69.catalog.repository.StoreSettingsRepository;
import com.gadget69.catalog.service.AuthTokenService;
import com.gadget69.catalog.service.OrderStateSupport;
import com.gadget69.catalog.service.ProductPricingService;
import com.gadget69.catalog.service.RazorpayPaymentService;
import com.gadget69.catalog.service.RazorpayPaymentService.RazorpayOrder;
import com.gadget69.catalog.service.EmailNotificationService;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
  private final ReviewRepository reviewRepository;
  private final CustomerOrderRepository customerOrderRepository;
  private final CatalogMapper catalogMapper;
  private final ProductPricingService productPricingService;
  private final RazorpayPaymentService razorpayPaymentService;
  private final EmailNotificationService emailNotificationService;
  private final ProductVariantRepository productVariantRepository;
  private final AuthTokenService authTokenService;

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
  @Transactional(readOnly = true)
  public List<ApiDtos.ProductResponse> products() {
    return productRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc().stream()
        .map(catalogMapper::toProductResponse)
        .toList();
  }

  @GetMapping("/products/{id}")
  @Transactional(readOnly = true)
  public ApiDtos.ProductResponse product(@PathVariable Long id) {
    Product product = productRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    return catalogMapper.toProductResponse(product);
  }

  @GetMapping("/variants/{id}")
  public ApiDtos.VariantResponse variant(@PathVariable Long id) {
    return productVariantRepository.findById(id)
        .map(catalogMapper::toVariantResponse)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Variant not found"));
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

  @GetMapping("/reviews")
  public List<ApiDtos.ReviewResponse> reviews() {
    return reviewRepository.findAllByOrderByReviewDateDescIdDesc().stream()
        .map(catalogMapper::toReviewResponse)
        .toList();
  }

  @PostMapping("/create-order")
  public ApiDtos.OrderResponse createOrder(@RequestBody ApiDtos.CreateOrderRequest request) {
    return createOrderInternal(request);
  }

  @PostMapping("/orders")
  public ApiDtos.OrderResponse createOrderAlias(@RequestBody ApiDtos.CreateOrderRequest request) {
    return createOrderInternal(request);
  }

  @GetMapping("/orders/{id}")
  public ApiDtos.OrderResponse getOrderById(
      HttpServletRequest request,
      @PathVariable Long id,
      @RequestParam(value = "phone", required = false) String phone) {
    CustomerOrder order = customerOrderRepository.findByIdAndIsDeletedFalse(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

    String authorization = request.getHeader("Authorization");
    if (authorization != null && !authorization.isBlank()) {
      authTokenService.requireAdmin(request);
      return catalogMapper.toOrderResponse(order);
    }

    String sanitizedPhone = requiredValue(InputSanitizer.sanitize(phone), "Phone number is required");
    InputSanitizer.validatePhone(sanitizedPhone);
    if (!normalizePhoneForComparison(order.getPhone()).equals(normalizePhoneForComparison(sanitizedPhone))) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
    }

    return catalogMapper.toOrderResponse(order);
  }

  private ApiDtos.OrderResponse createOrderInternal(ApiDtos.CreateOrderRequest request) {
    if (request == null || request.items() == null || request.items().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order items are required");
    }
    if (request.items().size() > 50) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Too many items in a single order");
    }

    String customerName = requiredValue(
        InputSanitizer.sanitizeAndValidate(request.customerName(), "customerName"),
        "Customer name is required");
    InputSanitizer.validateCustomerName(customerName);

    String phone = requiredValue(
        InputSanitizer.sanitize(request.phone()), "Phone number is required");
    InputSanitizer.validatePhone(phone);

    String email = requiredValue(
        InputSanitizer.sanitizeAndValidate(request.email(), "email"), "Email is required");
    InputSanitizer.validateEmail(email);

    String address = requiredValue(
        InputSanitizer.sanitizeAndValidate(request.address(), "address"), "Address is required");
    if (address.length() > 500) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Address is too long (max 500 chars)");
    }

    String pincode = requiredValue(
        InputSanitizer.sanitize(request.pincode()), "Pincode is required");
    InputSanitizer.validatePincode(pincode);

    CustomerOrder order = new CustomerOrder();
    order.setCustomerName(customerName);
    order.setPhone(phone);
    order.setEmail(email.toLowerCase(Locale.ROOT));
    order.setAddress(address);
    order.setPincode(pincode);
    order.setPaymentStatus("PENDING");
    order.setOrderStatus("PENDING");
    order.setCurrency("INR");

    HashSet<Long> productIds = new HashSet<>();
    for (ApiDtos.OrderItemPayload itemPayload : request.items()) {
      if (itemPayload.productId() == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product id is required");
      }
      productIds.add(itemPayload.productId());
    }

    Map<Long, Product> productsById = productRepository.findAllById(productIds).stream()
        .collect(java.util.stream.Collectors.toMap(Product::getId, product -> product));

    BigDecimal totalAmount = BigDecimal.ZERO;
    for (ApiDtos.OrderItemPayload itemPayload : request.items()) {
      Product product = productsById.get(itemPayload.productId());
      if (product == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product not found");
      }
      if (!"ACTIVE".equalsIgnoreCase(product.getStatus())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product is not available");
      }
      int quantity = normalizeQuantity(itemPayload.quantity());
      BigDecimal unitPrice = productPricingService.resolveEffectivePrice(product, LocalDate.now());
      if (unitPrice == null || unitPrice.signum() <= 0) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product price is not configured");
      }

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
    CustomerOrder savedOrder = customerOrderRepository.save(order);

    if (!razorpayPaymentService.isGatewayReady()) {
      return catalogMapper.toOrderResponse(savedOrder);
    }

    try {
      RazorpayOrder razorpayOrder = razorpayPaymentService.createOrder(savedOrder.getId(), totalAmount);
      savedOrder.setRazorpayOrderId(razorpayOrder.id());
      savedOrder.setAmountPaise(razorpayOrder.amountPaise());
      savedOrder.setCurrency(razorpayOrder.currency());
      savedOrder = customerOrderRepository.save(savedOrder);
      return withRazorpayKey(catalogMapper.toOrderResponse(savedOrder), razorpayOrder.keyId());
    } catch (ResponseStatusException ex) {
      savedOrder.setPaymentStatus("FAILED");
      try {
        customerOrderRepository.save(savedOrder);
      } catch (RuntimeException ignored) {
        // Preserve the original gateway failure response when the status update cannot be saved.
      }
      throw ex;
    }
  }

  @PostMapping("/verify-payment")
  public ApiDtos.OrderResponse verifyPayment(@RequestBody ApiDtos.PaymentVerifyRequest request) {
    if (request.orderId() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order ID is required");
    }
    if (request.razorpayOrderId() == null || request.razorpayOrderId().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Razorpay order ID is required for payment verification");
    }
    if (request.razorpayPaymentId() == null || request.razorpayPaymentId().isBlank()
        || request.razorpaySignature() == null || request.razorpaySignature().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Razorpay payment ID and signature are required");
    }

    CustomerOrder order = customerOrderRepository.findById(request.orderId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    if (!request.razorpayOrderId().equals(order.getRazorpayOrderId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Razorpay order ID does not match this order");
    }
    if (OrderStateSupport.isSuccessfulPayment(order.getPaymentStatus())
        && request.razorpayPaymentId().equals(order.getRazorpayPaymentId())) {
      return catalogMapper.toOrderResponse(order);
    }
    if (!OrderStateSupport.isPendingPayment(order.getPaymentStatus())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Order has already been processed");
    }
    if (!razorpayPaymentService.verifyPaymentSignature(
        order.getRazorpayOrderId(), request.razorpayPaymentId(), request.razorpaySignature())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Razorpay payment signature");
    }

    order.setPaymentStatus("SUCCESS");
    order.setOrderStatus("CONFIRMED");
    order.setRazorpayPaymentId(request.razorpayPaymentId());
    order.setRazorpaySignature(request.razorpaySignature());
    CustomerOrder saved = customerOrderRepository.save(order);
    emailNotificationService.sendOrderConfirmation(saved);
    return catalogMapper.toOrderResponse(saved);
  }

  @PostMapping("/razorpay/webhook")
  public ResponseEntity<Void> razorpayWebhook(
      @RequestBody String payload,
      @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
      @RequestHeader(value = "X-Razorpay-Event-Id", required = false) String eventId) {
    return handleRazorpayWebhookPayload(payload, signature, eventId);
  }

  /** Alias for /api/razorpay/webhook to satisfy spec requirement /webhook/razorpay */
  @PostMapping("/razorpay-webhook")
  public ResponseEntity<Void> razorpayWebhookAlias(
      @RequestBody String payload,
      @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
      @RequestHeader(value = "X-Razorpay-Event-Id", required = false) String eventId) {
    return handleRazorpayWebhookPayload(payload, signature, eventId);
  }

  private ResponseEntity<Void> handleRazorpayWebhookPayload(String payload, String signature, String eventId) {
    if (!razorpayPaymentService.verifyWebhookSignature(payload, signature)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Razorpay webhook signature");
    }

    JsonNode webhook = razorpayPaymentService.parseWebhook(payload);
    String event = webhook.path("event").asText("");

    if ("refund.processed".equals(event)) {
      handleRefundWebhook(webhook, eventId);
      return ResponseEntity.ok().build();
    }

    JsonNode payment = webhook.path("payload").path("payment").path("entity");
    String razorpayOrderId = payment.path("order_id").asText(null);
    if (razorpayOrderId == null || razorpayOrderId.isBlank()) {
      return ResponseEntity.ok().build();
    }

    customerOrderRepository.findByRazorpayOrderId(razorpayOrderId)
        .ifPresent(order -> applyPaymentWebhook(order, event, payment, eventId));
    return ResponseEntity.ok().build();
  }

  private void handleRefundWebhook(JsonNode webhook, String eventId) {
    JsonNode refund = webhook.path("payload").path("refund").path("entity");
    String paymentId = refund.path("payment_id").asText(null);
    if (paymentId == null || paymentId.isBlank()) {
      return;
    }

    customerOrderRepository.findByRazorpayPaymentId(paymentId).ifPresent(order -> {
      if (isDuplicateEvent(order, eventId)) {
        return;
      }
      order.setPaymentStatus("REFUNDED");
      order.setLastRazorpayEventId(eventId);
      customerOrderRepository.save(order);
    });
  }

  private void applyPaymentWebhook(CustomerOrder order, String event, JsonNode payment, String eventId) {
    if (isDuplicateEvent(order, eventId)) {
      return;
    }

    String paymentId = payment.path("id").asText(null);
    if (paymentId != null && !paymentId.isBlank()) {
      order.setRazorpayPaymentId(paymentId);
    }

    String paymentStatus = payment.path("status").asText("");
    if ("payment.captured".equals(event) || "captured".equalsIgnoreCase(paymentStatus)) {
      boolean shouldSendConfirmation = !OrderStateSupport.isSuccessfulPayment(order.getPaymentStatus());
      order.setPaymentStatus("SUCCESS");
      order.setOrderStatus("CONFIRMED");
      order.setLastRazorpayEventId(eventId);
      CustomerOrder saved = customerOrderRepository.save(order);
      if (shouldSendConfirmation) {
        emailNotificationService.sendOrderConfirmation(saved);
      }
      return;
    } else if ("payment.authorized".equals(event) || "authorized".equalsIgnoreCase(paymentStatus)) {
      if (OrderStateSupport.isPendingPayment(order.getPaymentStatus())) {
        order.setPaymentStatus("PENDING");
      }
    } else if ("payment.failed".equals(event) || "failed".equalsIgnoreCase(paymentStatus)) {
      if (!OrderStateSupport.isSuccessfulPayment(order.getPaymentStatus())
          && !"REFUNDED".equalsIgnoreCase(order.getPaymentStatus())) {
        order.setPaymentStatus("FAILED");
      }
    }

    order.setLastRazorpayEventId(eventId);
    customerOrderRepository.save(order);
  }

  private boolean isDuplicateEvent(CustomerOrder order, String eventId) {
    return eventId != null && !eventId.isBlank() && eventId.equals(order.getLastRazorpayEventId());
  }

  private ApiDtos.OrderResponse withRazorpayKey(ApiDtos.OrderResponse response, String razorpayKeyId) {
    return new ApiDtos.OrderResponse(
        response.id(),
        response.customerName(),
        response.phone(),
        response.email(),
        response.address(),
        response.pincode(),
        response.totalAmount(),
        response.paymentStatus(),
        response.orderStatus(),
        response.razorpayOrderId(),
        response.razorpayPaymentId(),
        response.createdAt(),
        response.updatedAt(),
        response.items(),
        response.currency(),
        response.amountPaise(),
        razorpayKeyId,
        response.isDeleted()
    );
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

  private String normalizePhoneForComparison(String phone) {
    if (phone == null) {
      return "";
    }
    String digits = phone.replaceAll("[^\\d]", "");
    if (digits.length() == 12 && digits.startsWith("91")) {
      return digits.substring(2);
    }
    return digits;
  }
}
