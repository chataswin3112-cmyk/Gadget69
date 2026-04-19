package com.gadget69.catalog.config;

import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class SecurityHeadersFilterTest {

  @Test
  void includesRazorpayHostsAndSensorPermissionsNeededForCheckout() throws Exception {
    SecurityHeadersFilter filter = new SecurityHeadersFilter();
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/");
    MockHttpServletResponse response = new MockHttpServletResponse();
    FilterChain chain = (req, res) -> { };

    filter.doFilterInternal(request, response, chain);

    String csp = response.getHeader("Content-Security-Policy");
    String permissionsPolicy = response.getHeader("Permissions-Policy");

    assertTrue(csp.contains("https://checkout.razorpay.com"));
    assertTrue(csp.contains("https://cdn.razorpay.com"));
    assertTrue(csp.contains("wss://*.sardine.ai"));
    assertTrue(permissionsPolicy.contains("accelerometer="));
    assertTrue(permissionsPolicy.contains("gyroscope="));
    assertTrue(permissionsPolicy.contains("magnetometer="));
  }
}
