package com.gadget69.catalog.controller;

import com.gadget69.catalog.dto.ApiDtos;
import com.gadget69.catalog.entity.CustomerOrder;
import com.gadget69.catalog.mapper.CatalogMapper;
import com.gadget69.catalog.repository.CustomerOrderRepository;
import com.gadget69.catalog.service.AuthTokenService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderManagementController {

  private static final Set<String> ALLOWED_STATUSES = Set.of("CONFIRMED", "SHIPPED", "DELIVERED");

  private final AuthTokenService authTokenService;
  private final CustomerOrderRepository customerOrderRepository;
  private final CatalogMapper catalogMapper;

  @GetMapping
  public List<ApiDtos.OrderResponse> getAllOrders(HttpServletRequest request) {
    authTokenService.requireAdmin(request);
    return customerOrderRepository.findAllByOrderByCreatedAtDesc().stream()
        .map(catalogMapper::toOrderResponse)
        .toList();
  }

  @PutMapping("/{id}/status")
  public ApiDtos.OrderResponse updateOrderStatus(
      HttpServletRequest request,
      @PathVariable Long id,
      @RequestBody ApiDtos.UpdateOrderStatusRequest updateRequest) {
    authTokenService.requireAdmin(request);

    String requestedStatus = updateRequest == null ? null : updateRequest.orderStatus();
    if (requestedStatus == null || requestedStatus.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order status is required");
    }

    String normalizedStatus = requestedStatus.trim().toUpperCase();
    if (!ALLOWED_STATUSES.contains(normalizedStatus)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Invalid order status. Must be one of: CONFIRMED, SHIPPED, DELIVERED");
    }

    CustomerOrder order = customerOrderRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

    order.setOrderStatus(normalizedStatus);
    return catalogMapper.toOrderResponse(customerOrderRepository.save(order));
  }
}
