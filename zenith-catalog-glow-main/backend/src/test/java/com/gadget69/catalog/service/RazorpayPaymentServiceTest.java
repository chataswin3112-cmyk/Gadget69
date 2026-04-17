package com.gadget69.catalog.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gadget69.catalog.config.AppProperties;
import org.junit.jupiter.api.Test;

class RazorpayPaymentServiceTest {

  @Test
  void verifiesRazorpayCheckoutSignatureWithConfiguredSecret() {
    AppProperties properties = new AppProperties();
    properties.getRazorpay().setEnabled(true);
    properties.getRazorpay().setKeyId("rzp_test_key");
    properties.getRazorpay().setKeySecret("test_secret");

    RazorpayPaymentService service = new RazorpayPaymentService(properties, new ObjectMapper());
    String signature = service.hmacSha256Hex("order_123|pay_456", "test_secret");

    assertTrue(service.verifyPaymentSignature("order_123", "pay_456", signature));
    assertFalse(service.verifyPaymentSignature("order_123", "pay_999", signature));
  }
}
