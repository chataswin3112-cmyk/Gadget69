package com.gadget69.catalog.service;

import com.gadget69.catalog.entity.CustomerOrder;
import com.gadget69.catalog.entity.OrderItem;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Sends HTML order-confirmation emails to customers.
 * Silently skips when mail is not configured (SMTP env vars missing).
 */
@Service
public class EmailNotificationService {

  private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

  private final JavaMailSender mailSender;

  @Value("${app.mail.enabled:false}")
  private boolean mailEnabled;

  @Value("${app.mail.from:noreply@gadget69.in}")
  private String mailFrom;

  // JavaMailSender is optional — Spring will inject null if no SMTP autoconfiguration is found.
  public EmailNotificationService(
      @org.springframework.beans.factory.annotation.Autowired(required = false)
      JavaMailSender mailSender) {
    this.mailSender = mailSender;
  }

  /**
   * Asynchronously sends an order confirmation email.
   * Silently skips if mail is disabled or customer email is not available.
   */
  @Async
  public void sendOrderConfirmation(CustomerOrder order) {
    if (!mailEnabled || mailSender == null) {
      log.debug("Mail not configured — skipping order confirmation email for order #{}", order.getId());
      return;
    }

    // Customer email is not collected by default in this project.
    // This method is intentionally a no-op unless email is stored on the order in the future.
    // When an email field is added, replace the guard below.
    String customerEmail = resolveCustomerEmail(order);
    if (customerEmail == null || customerEmail.isBlank()) {
      log.debug("No customer email for order #{} — skipping confirmation email", order.getId());
      return;
    }

    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
      helper.setFrom(mailFrom);
      helper.setTo(customerEmail);
      helper.setSubject("Order Confirmed — Gadget69 #" + order.getId());
      helper.setText(buildHtmlBody(order), true);
      mailSender.send(message);
      log.info("Order confirmation email sent for order #{} to {}", order.getId(), customerEmail);
    } catch (Exception ex) {
      log.error("Failed to send order confirmation email for order #{}", order.getId(), ex);
    }
  }

  /**
   * Resolves the customer's email address from the order.
   * Currently returns null — add logic here when an email field is added to CustomerOrder.
   */
  private String resolveCustomerEmail(CustomerOrder order) {
    // Stub: return order.getEmail() once the field is added to CustomerOrder.
    return null;
  }

  private String buildHtmlBody(CustomerOrder order) {
    NumberFormat currencyFmt = NumberFormat.getNumberInstance(Locale.US);

    StringBuilder items = new StringBuilder();
    for (OrderItem item : order.getItems()) {
      BigDecimal lineTotal = item.getPrice() == null ? BigDecimal.ZERO
          : item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity() == null ? 1 : item.getQuantity()));
      items.append("<tr>")
          .append("<td style='padding:8px 12px;border-bottom:1px solid #f0e8d8;'>")
          .append(item.getProductName()).append("</td>")
          .append("<td style='padding:8px 12px;border-bottom:1px solid #f0e8d8;text-align:center;'>")
          .append(item.getQuantity()).append("</td>")
          .append("<td style='padding:8px 12px;border-bottom:1px solid #f0e8d8;text-align:right;'>")
          .append("₹").append(currencyFmt.format(lineTotal)).append("</td>")
          .append("</tr>");
    }

    String total = order.getTotalAmount() == null ? "—"
        : "₹" + currencyFmt.format(order.getTotalAmount());

    return "<!DOCTYPE html><html><body style='font-family:Inter,sans-serif;background:#f9f5f0;margin:0;padding:20px;'>"
        + "<div style='max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);'>"
        + "<div style='background:#1a1a1a;padding:32px 24px;text-align:center;'>"
        + "<h1 style='color:#b88a44;font-size:28px;margin:0;letter-spacing:2px;'>GADGET 69</h1>"
        + "</div>"
        + "<div style='padding:32px 24px;'>"
        + "<h2 style='color:#1a1a1a;font-size:22px;margin:0 0 8px;'>Order Confirmed! 🎉</h2>"
        + "<p style='color:#666;margin:0 0 24px;'>Hi <strong>" + escapeHtml(order.getCustomerName()) + "</strong>, "
        + "your order <strong>#" + order.getId() + "</strong> has been received and confirmed.</p>"
        + "<table width='100%' style='border-collapse:collapse;margin-bottom:24px;'>"
        + "<thead><tr style='background:#f9f5f0;'>"
        + "<th style='padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;'>Product</th>"
        + "<th style='padding:10px 12px;text-align:center;font-size:12px;color:#888;text-transform:uppercase;'>Qty</th>"
        + "<th style='padding:10px 12px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;'>Amount</th>"
        + "</tr></thead>"
        + "<tbody>" + items + "</tbody>"
        + "<tfoot><tr>"
        + "<td colspan='2' style='padding:12px;font-weight:bold;'>Total</td>"
        + "<td style='padding:12px;text-align:right;font-weight:bold;color:#b88a44;font-size:18px;'>" + total + "</td>"
        + "</tr></tfoot></table>"
        + "<div style='background:#f9f5f0;border-radius:8px;padding:16px;margin-bottom:24px;'>"
        + "<p style='margin:0 0 6px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;'>Delivery Address</p>"
        + "<p style='margin:0;color:#333;'>" + escapeHtml(order.getAddress()) + " — " + escapeHtml(order.getPincode()) + "</p>"
        + "</div>"
        + "<p style='color:#888;font-size:13px;margin:0;'>We'll notify you when your order ships. "
        + "For support, contact us on our website.</p>"
        + "</div>"
        + "<div style='background:#f0e8d8;padding:20px 24px;text-align:center;'>"
        + "<p style='margin:0;font-size:12px;color:#999;'>© 2025 Gadget69. All rights reserved.</p>"
        + "</div>"
        + "</div></body></html>";
  }

  private String escapeHtml(String value) {
    if (value == null) return "";
    return value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;");
  }
}
