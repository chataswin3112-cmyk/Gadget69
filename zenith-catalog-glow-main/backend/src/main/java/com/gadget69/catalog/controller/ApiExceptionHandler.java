package com.gadget69.catalog.controller;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException exception) {
    Map<String, String> body = new LinkedHashMap<>();
    body.put("message", exception.getReason() == null ? "Request failed" : exception.getReason());
    return ResponseEntity.status(exception.getStatusCode()).body(body);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException exception) {
    Map<String, String> body = new LinkedHashMap<>();
    body.put("message", exception.getBindingResult().getAllErrors().stream()
        .findFirst()
        .map(error -> error.getDefaultMessage() == null ? "Validation failed" : error.getDefaultMessage())
        .orElse("Validation failed"));
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, String>> handleUnexpected(Exception exception) {
    Map<String, String> body = new LinkedHashMap<>();
    body.put("message", "Unexpected server error");
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
  }
}
