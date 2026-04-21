package com.gadget69.catalog.controller;

public class AdminOrdersLoadException extends RuntimeException {

  private final String requestId;

  public AdminOrdersLoadException(String requestId, Throwable cause) {
    super("Unable to load admin orders", cause);
    this.requestId = requestId;
  }

  public String getRequestId() {
    return requestId;
  }
}
