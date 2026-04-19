package com.gadget69.catalog.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gadget69.catalog.entity.CustomerOrder;
import com.gadget69.catalog.entity.OrderItem;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.util.Properties;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

class EmailNotificationServiceTest {

  @Test
  void sendOrderConfirmationUsesConfiguredFromAddressAndIncludesOrderIdInHtmlBody() throws Exception {
    JavaMailSender mailSender = mock(JavaMailSender.class);
    MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
    when(mailSender.createMimeMessage()).thenReturn(message);

    EmailNotificationService service = new EmailNotificationService(mailSender);
    ReflectionTestUtils.setField(service, "mailEnabled", true);
    ReflectionTestUtils.setField(service, "mailFrom", "orders@gadget69.in");

    CustomerOrder order = new CustomerOrder();
    order.setId(123L);
    order.setCustomerName("Riya");
    order.setEmail("customer.updated@example.com");
    order.setAddress("88 Lake Road");
    order.setPincode("560001");
    order.setOrderStatus("CONFIRMED");
    order.setTotalAmount(new BigDecimal("1499.00"));

    OrderItem item = new OrderItem();
    item.setProductName("Email Test Phone");
    item.setQuantity(1);
    item.setPrice(new BigDecimal("1499.00"));
    order.getItems().add(item);

    service.sendOrderConfirmation(order);

    verify(mailSender).send(message);
    assertThat(((InternetAddress) message.getFrom()[0]).getAddress()).isEqualTo("orders@gadget69.in");
    assertThat(((InternetAddress) message.getAllRecipients()[0]).getAddress())
        .isEqualTo("customer.updated@example.com");
    assertThat(message.getSubject()).isEqualTo("Order Confirmation - Gadget69");
    String htmlBody = readHtmlBody(message);
    assertThat(htmlBody).contains("#123");
    assertThat(htmlBody).contains("Email Test Phone");
    assertThat(htmlBody).contains("Order Confirmed");
  }

  private String readHtmlBody(MimeMessage message) throws Exception {
    return readBodyContent(message.getContent());
  }

  private String readBodyContent(Object content) throws Exception {
    if (content instanceof String body) {
      return body;
    }
    if (content instanceof Multipart multipart) {
      for (int index = 0; index < multipart.getCount(); index++) {
        String nested = readBodyContent(multipart.getBodyPart(index).getContent());
        if (!nested.isBlank()) {
          return nested;
        }
      }
      return "";
    }
    return content == null ? "" : content.toString();
  }
}
