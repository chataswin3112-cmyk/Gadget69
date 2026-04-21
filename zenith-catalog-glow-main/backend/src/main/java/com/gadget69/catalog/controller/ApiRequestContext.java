package com.gadget69.catalog.controller;

import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;

public final class ApiRequestContext {

  public static final String REQUEST_ID_ATTRIBUTE = "requestId";
  public static final String REQUEST_ID_HEADER = "X-Request-Id";

  private ApiRequestContext() {
  }

  public static String ensureRequestId(HttpServletRequest request) {
    Object existing = request.getAttribute(REQUEST_ID_ATTRIBUTE);
    if (existing instanceof String value && !value.isBlank()) {
      return value;
    }

    String headerValue = request.getHeader(REQUEST_ID_HEADER);
    String requestId = headerValue == null || headerValue.isBlank()
        ? UUID.randomUUID().toString()
        : headerValue.trim();
    request.setAttribute(REQUEST_ID_ATTRIBUTE, requestId);
    return requestId;
  }

  public static String getRequestId(HttpServletRequest request) {
    Object existing = request.getAttribute(REQUEST_ID_ATTRIBUTE);
    if (existing instanceof String value && !value.isBlank()) {
      return value;
    }
    return ensureRequestId(request);
  }
}
