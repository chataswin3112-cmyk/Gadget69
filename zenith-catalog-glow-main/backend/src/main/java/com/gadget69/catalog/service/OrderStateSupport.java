package com.gadget69.catalog.service;

import java.util.Locale;
import java.util.Set;

public final class OrderStateSupport {

  public static final Set<String> ADMIN_ORDER_STATUSES = Set.of(
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED");

  private static final Set<String> DELETABLE_PAYMENT_STATUSES = Set.of("FAILED", "PENDING");

  private OrderStateSupport() {
  }

  public static String normalizePaymentStatus(String status) {
    String normalized = normalizeToken(status, "PENDING");
    return switch (normalized) {
      case "PAID", "SUCCESS", "CAPTURED" -> "SUCCESS";
      case "AUTHORIZED" -> "PENDING";
      default -> normalized;
    };
  }

  public static String normalizeOrderStatus(String status) {
    String normalized = normalizeToken(status, "PENDING");
    return switch (normalized) {
      case "PLACED" -> "PENDING";
      case "OUT FOR DELIVERY" -> "OUT_FOR_DELIVERY";
      default -> normalized;
    };
  }

  public static boolean canDeleteOrder(String paymentStatus) {
    return DELETABLE_PAYMENT_STATUSES.contains(normalizePaymentStatus(paymentStatus));
  }

  public static boolean isSuccessfulPayment(String paymentStatus) {
    return "SUCCESS".equals(normalizePaymentStatus(paymentStatus));
  }

  public static boolean isFailedPayment(String paymentStatus) {
    return "FAILED".equals(normalizePaymentStatus(paymentStatus));
  }

  public static boolean isPendingPayment(String paymentStatus) {
    return "PENDING".equals(normalizePaymentStatus(paymentStatus));
  }

  private static String normalizeToken(String value, String fallback) {
    if (value == null || value.isBlank()) {
      return fallback;
    }
    return value.trim().replace('-', '_').replace(' ', '_').toUpperCase(Locale.ROOT);
  }
}
