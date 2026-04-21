package com.gadget69.catalog.controller;

import com.gadget69.catalog.dto.ApiDtos;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class ApiExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

  @ExceptionHandler(AdminOrdersLoadException.class)
  public ResponseEntity<ApiDtos.ApiErrorResponse> handleAdminOrdersLoadFailure(
      AdminOrdersLoadException exception,
      HttpServletRequest request,
      HttpServletResponse response) {
    String requestId = requestId(request, response);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(new ApiDtos.ApiErrorResponse(
            "ORDERS_LOAD_FAILED",
            "Unable to load orders. Please retry.",
            requestId));
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ApiDtos.ApiErrorResponse> handleResponseStatus(
      ResponseStatusException exception,
      HttpServletRequest request,
      HttpServletResponse response) {
    String requestId = requestId(request, response);
    HttpStatus status = HttpStatus.resolve(exception.getStatusCode().value());
    String message = exception.getReason() == null ? "Request failed" : exception.getReason();
    String code = switch (status) {
      case UNAUTHORIZED -> "UNAUTHORIZED";
      case FORBIDDEN -> "FORBIDDEN";
      case NOT_FOUND -> "NOT_FOUND";
      case BAD_REQUEST -> "BAD_REQUEST";
      default -> "REQUEST_FAILED";
    };
    return ResponseEntity.status(exception.getStatusCode())
        .body(new ApiDtos.ApiErrorResponse(code, message, requestId));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiDtos.ApiErrorResponse> handleValidation(
      MethodArgumentNotValidException exception,
      HttpServletRequest request,
      HttpServletResponse response) {
    String requestId = requestId(request, response);
    String message = exception.getBindingResult().getAllErrors().stream()
        .findFirst()
        .map(error -> error.getDefaultMessage() == null ? "Validation failed" : error.getDefaultMessage())
        .orElse("Validation failed");
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(new ApiDtos.ApiErrorResponse("BAD_REQUEST", message, requestId));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ApiDtos.ApiErrorResponse> handleUnreadableMessage(
      HttpMessageNotReadableException exception,
      HttpServletRequest request,
      HttpServletResponse response) {
    String requestId = requestId(request, response);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(new ApiDtos.ApiErrorResponse("BAD_REQUEST", "Invalid JSON request body", requestId));
  }

  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<ApiDtos.ApiErrorResponse> handleMissingParameter(
      MissingServletRequestParameterException exception,
      HttpServletRequest request,
      HttpServletResponse response) {
    String requestId = requestId(request, response);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(new ApiDtos.ApiErrorResponse(
            "BAD_REQUEST",
            exception.getParameterName() + " is required",
            requestId));
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ApiDtos.ApiErrorResponse> handleMethodNotSupported(
      HttpRequestMethodNotSupportedException exception,
      HttpServletRequest request,
      HttpServletResponse response) {
    String requestId = requestId(request, response);
    String message =
        "Request method "
            + (exception.getMethod() == null ? "UNKNOWN" : exception.getMethod())
            + " is not supported for this endpoint";
    return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
        .body(new ApiDtos.ApiErrorResponse("METHOD_NOT_ALLOWED", message, requestId));
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<ApiDtos.ApiErrorResponse> handleNoResourceFound(
      NoResourceFoundException exception,
      HttpServletRequest request,
      HttpServletResponse response) {
    String requestId = requestId(request, response);
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(new ApiDtos.ApiErrorResponse("NOT_FOUND", "Resource not found", requestId));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiDtos.ApiErrorResponse> handleUnexpected(
      Exception exception,
      HttpServletRequest request,
      HttpServletResponse response) {
    String requestId = requestId(request, response);
    log.error("Unexpected server error", exception);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(new ApiDtos.ApiErrorResponse("INTERNAL_SERVER_ERROR", "Unexpected server error", requestId));
  }

  private String requestId(HttpServletRequest request, HttpServletResponse response) {
    String requestId = ApiRequestContext.getRequestId(request);
    response.setHeader(ApiRequestContext.REQUEST_ID_HEADER, requestId);
    return requestId;
  }
}
