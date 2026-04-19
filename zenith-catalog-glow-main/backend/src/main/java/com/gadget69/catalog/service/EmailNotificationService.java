package com.gadget69.catalog.service;

import com.gadget69.catalog.entity.CustomerOrder;
import com.gadget69.catalog.entity.OrderItem;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailNotificationService {

  private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

  private final JavaMailSender mailSender;

  @Value("${app.mail.enabled:true}")
  private boolean mailEnabled;

  @Value("${app.mail.from:noreply@gadget69.in}")
  private String mailFrom;

  public EmailNotificationService(@Autowired(required = false) JavaMailSender mailSender) {
    this.mailSender = mailSender;
  }

  @Async
  public void sendOrderConfirmation(CustomerOrder order) {
    sendHtmlEmail(order, "Order Confirmation - Gadget69", buildHtmlBody(order));
  }

  @Async
  public void sendOrderStatusUpdate(CustomerOrder order) {
    String normalizedStatus = OrderStateSupport.normalizeOrderStatus(order.getOrderStatus());
    Map<String, String> subjectByStatus = Map.of(
        "SHIPPED", "Your Gadget69 order has shipped",
        "OUT_FOR_DELIVERY", "Your Gadget69 order is out for delivery",
        "DELIVERED", "Your Gadget69 order was delivered",
        "CANCELLED", "Your Gadget69 order was cancelled");
    String subject = subjectByStatus.getOrDefault(normalizedStatus, "Order Update - Gadget69");
    sendHtmlEmail(order, subject, buildStatusUpdateHtmlBody(order, normalizedStatus));
  }

  private void sendHtmlEmail(CustomerOrder order, String subject, String htmlBody) {
    if (!mailEnabled || mailSender == null || mailFrom == null || mailFrom.isBlank()) {
      log.debug("Mail is not configured. Skipping email for order #{}", order.getId());
      return;
    }

    String customerEmail = order.getEmail();
    if (customerEmail == null || customerEmail.isBlank()) {
      log.debug("No customer email available for order #{}. Skipping email.", order.getId());
      return;
    }

    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
      helper.setFrom(mailFrom.trim());
      helper.setTo(customerEmail.trim());
      helper.setSubject(subject);
      helper.setText(htmlBody, true);
      mailSender.send(message);
      log.info("Order email sent for order #{} to {} with subject {}", order.getId(), customerEmail, subject);
    } catch (Exception ex) {
      log.error("Failed to send order email for order #{}", order.getId(), ex);
    }
  }

  private String buildHtmlBody(CustomerOrder order) {
    NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
    currencyFormat.setMaximumFractionDigits(2);

    StringBuilder rows = new StringBuilder();
    for (OrderItem item : order.getItems()) {
      int quantity = item.getQuantity() == null ? 0 : item.getQuantity();
      BigDecimal unitPrice = item.getPrice() == null ? BigDecimal.ZERO : item.getPrice();
      BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));

      rows.append("<tr>")
          .append("<td style='padding:12px 14px;border-bottom:1px solid #eee7da;'>")
          .append(escapeHtml(item.getProductName()))
          .append("</td>")
          .append("<td style='padding:12px 14px;border-bottom:1px solid #eee7da;text-align:center;'>")
          .append(quantity)
          .append("</td>")
          .append("<td style='padding:12px 14px;border-bottom:1px solid #eee7da;text-align:right;'>")
          .append(escapeHtml(currencyFormat.format(lineTotal)))
          .append("</td>")
          .append("</tr>");
    }

    String totalAmount = order.getTotalAmount() == null
        ? "--"
        : escapeHtml(currencyFormat.format(order.getTotalAmount()));

    return "<!DOCTYPE html>"
        + "<html><body style='margin:0;padding:24px;background:#f6f3ed;font-family:Arial,sans-serif;color:#1f1f1f;'>"
        + "<div style='max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #ece5d8;border-radius:20px;overflow:hidden;'>"
        + "<div style='padding:28px 32px;background:#141414;'>"
        + "<h1 style='margin:0;color:#c8a86a;font-size:28px;letter-spacing:2px;'>Gadget69</h1>"
        + "</div>"
        + "<div style='padding:32px;'>"
        + "<p style='margin:0 0 10px;font-size:28px;font-weight:700;'>Order Confirmed &#127881;</p>"
        + "<p style='margin:0 0 24px;color:#5f5f5f;'>Hi <strong>"
        + escapeHtml(order.getCustomerName())
        + "</strong>, your order has been received successfully.</p>"
        + "<div style='display:flex;gap:14px;flex-wrap:wrap;margin-bottom:24px;'>"
        + "<div style='flex:1;min-width:180px;background:#fcf7ee;border:1px solid #eadfc7;border-radius:16px;padding:18px;'>"
        + "<div style='font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#8a7447;margin-bottom:8px;'>Order ID</div>"
        + "<div style='font-size:22px;font-weight:700;'>#"
        + order.getId()
        + "</div>"
        + "</div>"
        + "<div style='flex:1;min-width:180px;background:#fcf7ee;border:1px solid #eadfc7;border-radius:16px;padding:18px;text-align:right;'>"
        + "<div style='font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#8a7447;margin-bottom:8px;'>Total Amount</div>"
        + "<div style='font-size:22px;font-weight:700;color:#b88a44;'>"
        + totalAmount
        + "</div>"
        + "</div>"
        + "</div>"
        + "<table width='100%' style='border-collapse:collapse;border:1px solid #eee7da;border-radius:14px;overflow:hidden;margin-bottom:22px;'>"
        + "<thead><tr style='background:#faf5eb;'>"
        + "<th style='padding:12px 14px;text-align:left;font-size:12px;color:#6a6a6a;text-transform:uppercase;'>Product Name</th>"
        + "<th style='padding:12px 14px;text-align:center;font-size:12px;color:#6a6a6a;text-transform:uppercase;'>Quantity</th>"
        + "<th style='padding:12px 14px;text-align:right;font-size:12px;color:#6a6a6a;text-transform:uppercase;'>Total</th>"
        + "</tr></thead>"
        + "<tbody>"
        + rows
        + "</tbody></table>"
        + "<div style='background:#f8f8f8;border-radius:14px;padding:18px;margin-bottom:18px;'>"
        + "<p style='margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7a7a7a;'>Order Status</p>"
        + "<p style='margin:0 0 14px;font-size:18px;font-weight:700;'>"
        + escapeHtml(order.getOrderStatus() == null ? "CONFIRMED" : order.getOrderStatus())
        + "</p>"
        + "<p style='margin:0;color:#5f5f5f;'>We will ship your order soon &#128666;</p>"
        + "</div>"
        + "<div style='background:#faf5eb;border-radius:14px;padding:18px;margin-bottom:18px;'>"
        + "<p style='margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7a7a7a;'>Delivery Details</p>"
        + "<p style='margin:0 0 6px;'>"
        + escapeHtml(order.getAddress())
        + "</p>"
        + "<p style='margin:0;'>"
        + escapeHtml(order.getPincode())
        + "</p>"
        + "</div>"
        + "<p style='margin:0;color:#5f5f5f;'>Thanks for shopping with Gadget69 &#10084;</p>"
        + "</div>"
        + "</div>"
        + "</body></html>";
  }

  private String buildStatusUpdateHtmlBody(CustomerOrder order, String normalizedStatus) {
    NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
    currencyFormat.setMaximumFractionDigits(2);

    String heading = switch (normalizedStatus) {
      case "SHIPPED" -> "Your order is on the way";
      case "OUT_FOR_DELIVERY" -> "Your order is out for delivery";
      case "DELIVERED" -> "Your order was delivered";
      case "CANCELLED" -> "Your order was cancelled";
      default -> "Your order status changed";
    };

    String message = switch (normalizedStatus) {
      case "SHIPPED" -> "Our team has dispatched your package and it is moving through the courier network.";
      case "OUT_FOR_DELIVERY" -> "Your package is with the delivery partner and should reach you soon.";
      case "DELIVERED" -> "We hope everything reached you safely. Thank you for shopping with Gadget69.";
      case "CANCELLED" -> "Your order has been cancelled. If you did not request this, please contact support.";
      default -> "You can track the latest progress anytime using your order ID and phone number.";
    };

    String totalAmount = order.getTotalAmount() == null
        ? "--"
        : escapeHtml(currencyFormat.format(order.getTotalAmount()));

    return "<!DOCTYPE html>"
        + "<html><body style='margin:0;padding:24px;background:#f6f3ed;font-family:Arial,sans-serif;color:#1f1f1f;'>"
        + "<div style='max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #ece5d8;border-radius:20px;overflow:hidden;'>"
        + "<div style='padding:28px 32px;background:#141414;'>"
        + "<h1 style='margin:0;color:#c8a86a;font-size:28px;letter-spacing:2px;'>Gadget69</h1>"
        + "</div>"
        + "<div style='padding:32px;'>"
        + "<p style='margin:0 0 10px;font-size:28px;font-weight:700;'>"
        + escapeHtml(heading)
        + "</p>"
        + "<p style='margin:0 0 24px;color:#5f5f5f;'>Hi <strong>"
        + escapeHtml(order.getCustomerName())
        + "</strong>, "
        + escapeHtml(message)
        + "</p>"
        + "<div style='display:flex;gap:14px;flex-wrap:wrap;margin-bottom:24px;'>"
        + "<div style='flex:1;min-width:180px;background:#fcf7ee;border:1px solid #eadfc7;border-radius:16px;padding:18px;'>"
        + "<div style='font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#8a7447;margin-bottom:8px;'>Order ID</div>"
        + "<div style='font-size:22px;font-weight:700;'>#"
        + order.getId()
        + "</div>"
        + "</div>"
        + "<div style='flex:1;min-width:180px;background:#fcf7ee;border:1px solid #eadfc7;border-radius:16px;padding:18px;text-align:right;'>"
        + "<div style='font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#8a7447;margin-bottom:8px;'>Total Amount</div>"
        + "<div style='font-size:22px;font-weight:700;color:#b88a44;'>"
        + totalAmount
        + "</div>"
        + "</div>"
        + "</div>"
        + "<div style='background:#f8f8f8;border-radius:14px;padding:18px;margin-bottom:18px;'>"
        + "<p style='margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7a7a7a;'>Current Status</p>"
        + "<p style='margin:0;font-size:18px;font-weight:700;'>"
        + escapeHtml(normalizedStatus)
        + "</p>"
        + "</div>"
        + "<p style='margin:0;color:#5f5f5f;'>Track your order anytime using your order ID and phone number.</p>"
        + "</div>"
        + "</div>"
        + "</body></html>";
  }

  private String escapeHtml(String value) {
    if (value == null) {
      return "";
    }
    return value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;");
  }
}
