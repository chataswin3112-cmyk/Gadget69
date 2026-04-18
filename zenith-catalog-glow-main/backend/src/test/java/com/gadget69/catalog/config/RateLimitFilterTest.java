package com.gadget69.catalog.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RateLimitFilterTest {

  @Test
  void successfulLoginClearsAttemptCounter() throws Exception {
    RateLimitFilter filter = new RateLimitFilter();

    for (int attempt = 0; attempt < 6; attempt++) {
      MockHttpServletResponse response = apply(filter, 200, new AtomicInteger());
      assertEquals(200, response.getStatus());
    }
  }

  @Test
  void repeatedUnauthorizedLoginsEventuallyReturnTooManyRequests() throws Exception {
    RateLimitFilter filter = new RateLimitFilter();
    AtomicInteger chainCalls = new AtomicInteger();

    for (int attempt = 0; attempt < 5; attempt++) {
      MockHttpServletResponse response = apply(filter, 401, chainCalls);
      assertEquals(401, response.getStatus());
    }

    MockHttpServletResponse blockedResponse = apply(filter, 401, chainCalls);
    assertEquals(429, blockedResponse.getStatus());
    assertEquals(5, chainCalls.get());
  }

  private MockHttpServletResponse apply(
      RateLimitFilter filter, int downstreamStatus, AtomicInteger chainCalls) throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/admin/login");
    request.setServletPath("/api/admin/login");
    request.setRemoteAddr("127.0.0.1");
    MockHttpServletResponse response = new MockHttpServletResponse();
    FilterChain chain = (req, res) -> setStatus((HttpServletResponse) res, downstreamStatus, chainCalls);
    filter.doFilterInternal(request, response, chain);
    return response;
  }

  private void setStatus(HttpServletResponse response, int status, AtomicInteger chainCalls)
      throws IOException {
    chainCalls.incrementAndGet();
    response.setStatus(status);
  }
}
