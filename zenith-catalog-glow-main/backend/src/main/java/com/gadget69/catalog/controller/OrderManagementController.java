package com.gadget69.catalog.controller;

import com.gadget69.catalog.config.InputSanitizer;
import com.gadget69.catalog.dto.ApiDtos;
import com.gadget69.catalog.entity.AdminUser;
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
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
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

  private static final Logger log = LoggerFactory.getLogger(OrderManagementController.class);
  private static final Set<String> ADMIN_PAYMENT_STATUSES =
      Set.of("PENDING", "SUCCESS", "FAILED", "REFUNDED");
  private static final Set<String> DISABLED_ORDER_STATUS_FILTER =
      Set.of("__NO_ORDER_STATUS_FILTER__");
  private static final Set<String> DISABLED_PAYMENT_STATUS_FILTER =
      Set.of("__NO_PAYMENT_STATUS_FILTER__");
  private static final LocalDateTime DISABLED_DATE_FILTER = LocalDateTime.of(1970, 1, 1, 0, 0);

  private final AuthTokenService authTokenService;
  private final CustomerOrderRepository customerOrderRepository;
  private final CatalogMapper catalogMapper;
  private final EmailNotificationService emailNotificationService;

  @GetMapping
  @Transactional(readOnly = true)
  public ResponseEntity<ApiDtos.AdminOrdersResponse> getAllOrders(
      HttpServletRequest request,
      @RequestParam(value = "orderStatus", required = false) String orderStatus,
      @RequestParam(value = "paymentStatus", required = false) String paymentStatus,
      @RequestParam(value = "fromDate", required = false) String fromDate,
      @RequestParam(value = "toDate", required = false) String toDate) {
    String requestId = ApiRequestContext.ensureRequestId(request);
    AdminUser adminUser = authTokenService.requireAdmin(request);
    NormalizedAdminOrderFilters normalizedFilters =
        normalizeAdminOrderFilters(orderStatus, paymentStatus, fromDate, toDate);

    List<CustomerOrder> orders;
    try {
      orders = customerOrderRepository.findAdminOrders(
          !normalizedFilters.orderStatuses().isEmpty(),
          normalizedFilters.orderStatuses().isEmpty()
              ? DISABLED_ORDER_STATUS_FILTER
              : normalizedFilters.orderStatuses(),
          !normalizedFilters.paymentStatuses().isEmpty(),
          normalizedFilters.paymentStatuses().isEmpty()
              ? DISABLED_PAYMENT_STATUS_FILTER
              : normalizedFilters.paymentStatuses(),
          normalizedFilters.fromCreatedAt() != null,
          normalizedFilters.fromCreatedAt() == null
              ? DISABLED_DATE_FILTER
              : normalizedFilters.fromCreatedAt(),
          normalizedFilters.toCreatedAtExclusive() != null,
          normalizedFilters.toCreatedAtExclusive() == null
              ? DISABLED_DATE_FILTER
              : normalizedFilters.toCreatedAtExclusive());
    } catch (Exception ex) {
      log.error(
          "Admin orders query failed requestId={} adminId={} filters={}",
          requestId,
          adminUser.getId(),
          normalizedFilters.logDescription(),
          ex);
      throw new AdminOrdersLoadException(requestId, ex);
    }

    List<ApiDtos.OrderResponse> items;
    try {
      items = orders.stream().map(catalogMapper::toOrderResponse).toList();
    } catch (Exception ex) {
      log.error(
          "Admin orders serialization failed requestId={} adminId={} filters={}",
          requestId,
          adminUser.getId(),
          normalizedFilters.logDescription(),
          ex);
      throw new AdminOrdersLoadException(requestId, ex);
    }

    log.info(
        "Admin orders loaded requestId={} adminId={} filters={} total={}",
        requestId,
        adminUser.getId(),
        normalizedFilters.logDescription(),
        items.size());

    ApiDtos.AdminOrdersResponse responseBody =
        new ApiDtos.AdminOrdersResponse(
            items,
            items.size(),
            normalizedFilters.toResponse());

    return ResponseEntity.ok()
        .header(ApiRequestContext.REQUEST_ID_HEADER, requestId)
        .body(responseBody);
  }

  @GetMapping("/{id}")
  @Transactional(readOnly = true)
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

    String specialInstructions = sanitizeSpecialInstructions(updateRequest.specialInstructions());

    CustomerOrder order = getActiveOrder(id);
    order.setCustomerName(customerName);
    order.setPhone(phone);
    order.setEmail(email.toLowerCase(java.util.Locale.ROOT));
    order.setAddress(address);
    order.setPincode(pincode);
    order.setSpecialInstructions(specialInstructions);
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

  private NormalizedAdminOrderFilters normalizeAdminOrderFilters(
      String rawOrderStatus,
      String rawPaymentStatus,
      String rawFromDate,
      String rawToDate) {
    Set<String> orderStatuses =
        normalizeStatuses(rawOrderStatus, true, OrderStateSupport.ADMIN_ORDER_STATUSES);
    Set<String> paymentStatuses =
        normalizeStatuses(rawPaymentStatus, false, ADMIN_PAYMENT_STATUSES);

    LocalDate from = parseDateSafely(rawFromDate);
    LocalDate to = parseDateSafely(rawToDate);
    if (from != null && to != null && from.isAfter(to)) {
      from = null;
      to = null;
    }

    return new NormalizedAdminOrderFilters(
        orderStatuses,
        paymentStatuses,
        from,
        to,
        from == null ? null : from.atStartOfDay(),
        to == null ? null : to.plusDays(1).atStartOfDay());
  }

  private Set<String> normalizeStatuses(
      String rawStatuses,
      boolean orderStatus,
      Set<String> allowedValues) {
    if (rawStatuses == null || rawStatuses.isBlank()) {
      return Set.of();
    }

    return Arrays.stream(rawStatuses.split(","))
        .map(String::trim)
        .filter(value -> !value.isBlank())
        .map(value -> orderStatus
            ? OrderStateSupport.normalizeOrderStatus(value)
            : OrderStateSupport.normalizePaymentStatus(value))
        .filter(allowedValues::contains)
        .collect(java.util.stream.Collectors.toUnmodifiableSet());
  }

  private LocalDate parseDateSafely(String rawDate) {
    if (rawDate == null || rawDate.isBlank()) {
      return null;
    }
    try {
      return LocalDate.parse(rawDate.trim());
    } catch (Exception ex) {
      return null;
    }
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

  private String sanitizeSpecialInstructions(String specialInstructions) {
    String sanitized = InputSanitizer.sanitizeAndValidate(specialInstructions, "specialInstructions");
    if (sanitized == null || sanitized.isBlank()) {
      return null;
    }
    if (sanitized.length() > 500) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Special instructions are too long (max 500 chars)");
    }
    return sanitized;
  }

  private record NormalizedAdminOrderFilters(
      Set<String> orderStatuses,
      Set<String> paymentStatuses,
      LocalDate fromDate,
      LocalDate toDate,
      LocalDateTime fromCreatedAt,
      LocalDateTime toCreatedAtExclusive) {

    private ApiDtos.AdminOrdersAppliedFilters toResponse() {
      return new ApiDtos.AdminOrdersAppliedFilters(
          join(orderStatuses),
          join(paymentStatuses),
          fromDate == null ? null : fromDate.toString(),
          toDate == null ? null : toDate.toString());
    }

    private String logDescription() {
      return String.format(
          Locale.ROOT,
          "{orderStatus=%s,paymentStatus=%s,fromDate=%s,toDate=%s}",
          join(orderStatuses),
          join(paymentStatuses),
          fromDate == null ? "null" : fromDate,
          toDate == null ? "null" : toDate);
    }

    private static String join(Set<String> values) {
      return values.isEmpty() ? null : String.join(",", values);
    }
  }
}
