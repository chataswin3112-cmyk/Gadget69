package com.gadget69.catalog.controller;

import com.gadget69.catalog.config.InputSanitizer;
import com.gadget69.catalog.dto.ApiDtos;
import com.gadget69.catalog.entity.CustomerOrder;
import com.gadget69.catalog.mapper.CatalogMapper;
import com.gadget69.catalog.repository.CustomerOrderRepository;
import com.gadget69.catalog.service.AuthTokenService;
import com.gadget69.catalog.service.EmailNotificationService;
import com.gadget69.catalog.service.OrderStateSupport;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class OrderManagementController {

  private final AuthTokenService authTokenService;
  private final CustomerOrderRepository customerOrderRepository;
  private final CatalogMapper catalogMapper;
  private final EmailNotificationService emailNotificationService;

  @GetMapping
  public List<ApiDtos.OrderResponse> getAllOrders(
      HttpServletRequest request,
      @RequestParam(value = "orderStatus", required = false) String orderStatus,
      @RequestParam(value = "paymentStatus", required = false) String paymentStatus,
      @RequestParam(value = "fromDate", required = false) String fromDate,
      @RequestParam(value = "toDate", required = false) String toDate) {
    authTokenService.requireAdmin(request);

    LocalDate from = parseDate(fromDate, "fromDate");
    LocalDate to = parseDate(toDate, "toDate");
    if (from != null && to != null && from.isAfter(to)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fromDate cannot be after toDate");
    }

    Set<String> orderStatuses = parseStatuses(orderStatus, true);
    Set<String> paymentStatuses = parseStatuses(paymentStatus, false);

    return customerOrderRepository.findAllByIsDeletedFalseOrderByCreatedAtDesc().stream()
        .filter(order -> matchesOrderStatus(order, orderStatuses))
        .filter(order -> matchesPaymentStatus(order, paymentStatuses))
        .filter(order -> matchesCreatedAt(order, from, to))
        .map(catalogMapper::toOrderResponse)
        .toList();
  }

  @GetMapping("/{id}")
  public ApiDtos.OrderResponse getOrder(HttpServletRequest request, @PathVariable Long id) {
    authTokenService.requireAdmin(request);
    return catalogMapper.toOrderResponse(getActiveOrder(id));
  }

  @PutMapping("/{id}/status")
  public ApiDtos.OrderResponse updateOrderStatus(
      HttpServletRequest request,
      @PathVariable Long id,
      @RequestBody ApiDtos.UpdateOrderStatusRequest updateRequest) {
    authTokenService.requireAdmin(request);

    String requestedStatus = updateRequest == null ? null : updateRequest.orderStatus();
    String normalizedStatus = normalizeRequestedOrderStatus(requestedStatus);

    CustomerOrder order = getActiveOrder(id);
    order.setOrderStatus(normalizedStatus);
    CustomerOrder saved = customerOrderRepository.save(order);
    sendStatusNotificationIfNeeded(saved);
    return catalogMapper.toOrderResponse(saved);
  }

  @PutMapping("/{id}/details")
  public ApiDtos.OrderResponse updateOrderDetails(
      HttpServletRequest request,
      @PathVariable Long id,
      @RequestBody ApiDtos.UpdateOrderDetailsRequest updateRequest) {
    authTokenService.requireAdmin(request);

    if (updateRequest == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Update payload is required");
    }

    String customerName = requiredValue(
        InputSanitizer.sanitizeAndValidate(updateRequest.customerName(), "customerName"),
        "Customer name is required");
    InputSanitizer.validateCustomerName(customerName);

    String phone = requiredValue(
        InputSanitizer.sanitize(updateRequest.phone()), "Phone number is required");
    InputSanitizer.validatePhone(phone);

    String email = requiredValue(
        InputSanitizer.sanitizeAndValidate(updateRequest.email(), "email"), "Email is required");
    InputSanitizer.validateEmail(email);

    String address = requiredValue(
        InputSanitizer.sanitizeAndValidate(updateRequest.address(), "address"), "Address is required");
    if (address.length() > 500) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Address is too long (max 500 chars)");
    }

    String pincode = requiredValue(
        InputSanitizer.sanitize(updateRequest.pincode()), "Pincode is required");
    InputSanitizer.validatePincode(pincode);

    CustomerOrder order = getActiveOrder(id);
    order.setCustomerName(customerName);
    order.setPhone(phone);
    order.setEmail(email.toLowerCase(java.util.Locale.ROOT));
    order.setAddress(address);
    order.setPincode(pincode);
    return catalogMapper.toOrderResponse(customerOrderRepository.save(order));
  }

  @PutMapping("/{id}/cancel")
  public ApiDtos.OrderResponse cancelOrder(HttpServletRequest request, @PathVariable Long id) {
    authTokenService.requireAdmin(request);

    CustomerOrder order = getActiveOrder(id);
    order.setOrderStatus("CANCELLED");
    CustomerOrder saved = customerOrderRepository.save(order);
    sendStatusNotificationIfNeeded(saved);
    return catalogMapper.toOrderResponse(saved);
  }

  @PutMapping("/{id}/archive")
  public ApiDtos.OrderResponse archiveOrder(HttpServletRequest request, @PathVariable Long id) {
    authTokenService.requireAdmin(request);

    CustomerOrder order = getActiveOrder(id);
    order.setDeleted(true);
    return catalogMapper.toOrderResponse(customerOrderRepository.save(order));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteOrder(HttpServletRequest request, @PathVariable Long id) {
    authTokenService.requireAdmin(request);

    CustomerOrder order = getActiveOrder(id);
    if (!OrderStateSupport.canDeleteOrder(order.getPaymentStatus())) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Delete is allowed only for FAILED or PENDING payments. Successful payments can only be cancelled or archived.");
    }

    customerOrderRepository.delete(order);
    return ResponseEntity.noContent().build();
  }

  private CustomerOrder getActiveOrder(Long id) {
    return customerOrderRepository.findByIdAndIsDeletedFalse(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
  }

  private String normalizeRequestedOrderStatus(String requestedStatus) {
    if (requestedStatus == null || requestedStatus.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order status is required");
    }

    String normalizedStatus = OrderStateSupport.normalizeOrderStatus(requestedStatus);
    if (!OrderStateSupport.ADMIN_ORDER_STATUSES.contains(normalizedStatus)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Invalid order status. Must be one of: PENDING, CONFIRMED, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED");
    }
    return normalizedStatus;
  }

  private Set<String> parseStatuses(String rawStatuses, boolean orderStatus) {
    if (rawStatuses == null || rawStatuses.isBlank()) {
      return Set.of();
    }

    Set<String> normalized = Arrays.stream(rawStatuses.split(","))
        .map(String::trim)
        .filter(value -> !value.isBlank())
        .map(value -> orderStatus
            ? OrderStateSupport.normalizeOrderStatus(value)
            : OrderStateSupport.normalizePaymentStatus(value))
        .collect(java.util.stream.Collectors.toSet());

    if (orderStatus && normalized.stream().anyMatch(status -> !OrderStateSupport.ADMIN_ORDER_STATUSES.contains(status))) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more order statuses are invalid");
    }
    return normalized;
  }

  private LocalDate parseDate(String rawDate, String fieldName) {
    if (rawDate == null || rawDate.isBlank()) {
      return null;
    }
    try {
      return LocalDate.parse(rawDate.trim());
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be in YYYY-MM-DD format");
    }
  }

  private boolean matchesOrderStatus(CustomerOrder order, Set<String> statuses) {
    if (statuses.isEmpty()) {
      return true;
    }
    return statuses.contains(OrderStateSupport.normalizeOrderStatus(order.getOrderStatus()));
  }

  private boolean matchesPaymentStatus(CustomerOrder order, Set<String> statuses) {
    if (statuses.isEmpty()) {
      return true;
    }
    return statuses.contains(OrderStateSupport.normalizePaymentStatus(order.getPaymentStatus()));
  }

  private boolean matchesCreatedAt(CustomerOrder order, LocalDate from, LocalDate to) {
    LocalDateTime createdAt = order.getCreatedAt();
    if (createdAt == null) {
      return from == null && to == null;
    }

    LocalDate orderDate = createdAt.toLocalDate();
    if (from != null && orderDate.isBefore(from)) {
      return false;
    }
    if (to != null && orderDate.isAfter(to)) {
      return false;
    }
    return true;
  }

  private void sendStatusNotificationIfNeeded(CustomerOrder order) {
    String normalizedStatus = OrderStateSupport.normalizeOrderStatus(order.getOrderStatus());
    if (Set.of("SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED").contains(normalizedStatus)) {
      emailNotificationService.sendOrderStatusUpdate(order);
    }
  }

  private String requiredValue(String value, String message) {
    if (value == null || value.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
    return value.trim();
  }
}
