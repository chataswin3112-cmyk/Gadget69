package com.gadget69.catalog.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.gadget69.catalog.service.RazorpayPaymentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:razorpay-env-binding;DB_CLOSE_DELAY=-1",
    "RAZORPAY_ENABLED=true",
    "RAZORPAY_KEY_ID=rzp_test_plain_key",
    "RAZORPAY_KEY_SECRET=plain_secret",
    "RAZORPAY_WEBHOOK_SECRET=plain_webhook_secret"
})
class RazorpayEnvironmentBindingTest {

  @Autowired
  private AppProperties appProperties;

  @Autowired
  private RazorpayPaymentService razorpayPaymentService;

  @Test
  void bindsPlainRazorpayEnvironmentVariables() {
    assertTrue(appProperties.getRazorpay().isEnabled());
    assertEquals("rzp_test_plain_key", appProperties.getRazorpay().getKeyId());
    assertEquals("plain_secret", appProperties.getRazorpay().getKeySecret());
    assertEquals("plain_webhook_secret", appProperties.getRazorpay().getWebhookSecret());
    assertTrue(razorpayPaymentService.isGatewayReady());
    assertEquals("rzp_test_plain_key", razorpayPaymentService.getKeyId());
  }
}
