package com.gadget69.catalog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gadget69.catalog.config.AppProperties;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RazorpayPaymentService {

  private static final Logger log = LoggerFactory.getLogger(RazorpayPaymentService.class);
  private static final String CURRENCY = "INR";
  private static final String HMAC_SHA256 = "HmacSHA256";

  private final AppProperties appProperties;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public RazorpayPaymentService(AppProperties appProperties, ObjectMapper objectMapper) {
    this.appProperties = appProperties;
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newHttpClient();
  }

  public RazorpayOrder createOrder(Long localOrderId, BigDecimal totalAmount) {
    int amountPaise = toPaise(totalAmount);
    requirePaymentCredentials();
    URI ordersApiUri = ordersApiUri();

    try {
      String payload = objectMapper.writeValueAsString(Map.of(
          "amount", amountPaise,
          "currency", CURRENCY,
          "receipt", "order_" + String.valueOf(localOrderId),
          "notes", Map.of("local_order_id", String.valueOf(localOrderId))));

      HttpRequest request = HttpRequest.newBuilder()
          .uri(ordersApiUri)
          .header("Authorization", basicAuthHeader())
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(payload))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        log.error("Razorpay order creation failed. status={}, body={}", response.statusCode(), response.body());
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to create Razorpay order");
      }

      JsonNode json = objectMapper.readTree(response.body());
      String razorpayOrderId = json.path("id").asText();
      if (!hasText(razorpayOrderId)) {
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Razorpay order response is missing an id");
      }

      return new RazorpayOrder(
          razorpayOrderId,
          json.path("amount").asInt(amountPaise),
          json.path("currency").asText(CURRENCY),
          appProperties.getRazorpay().getKeyId());
    } catch (IOException ex) {
      log.error("Unable to parse Razorpay order response", ex);
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to parse Razorpay response", ex);
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      log.error("Razorpay order request was interrupted", ex);
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Razorpay order request was interrupted", ex);
    }
  }

  public boolean verifyPaymentSignature(String razorpayOrderId, String razorpayPaymentId, String signature) {
    requirePaymentCredentials();
    if (!hasText(razorpayOrderId) || !hasText(razorpayPaymentId) || !hasText(signature)) {
      return false;
    }
    String expected = hmacSha256Hex(
        razorpayOrderId + "|" + razorpayPaymentId,
        appProperties.getRazorpay().getKeySecret());
    return constantTimeEquals(expected, signature);
  }

  public boolean verifyWebhookSignature(String payload, String signature) {
    requireWebhookSecret();
    if (!hasText(payload) || !hasText(signature)) {
      return false;
    }
    String expected = hmacSha256Hex(payload, appProperties.getRazorpay().getWebhookSecret());
    return constantTimeEquals(expected, signature);
  }

  public String getKeyId() {
    return appProperties.getRazorpay().isEnabled() ? appProperties.getRazorpay().getKeyId() : null;
  }

  public boolean isGatewayReady() {
    return appProperties.getRazorpay().isEnabled()
        && hasText(appProperties.getRazorpay().getKeyId())
        && hasText(appProperties.getRazorpay().getKeySecret());
  }

  public JsonNode parseWebhook(String payload) {
    try {
      return objectMapper.readTree(payload);
    } catch (IOException ex) {
      log.error("Invalid Razorpay webhook payload", ex);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Razorpay webhook payload", ex);
    }
  }

  public String hmacSha256Hex(String value, String secret) {
    try {
      Mac mac = Mac.getInstance(HMAC_SHA256);
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
      byte[] digest = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
      StringBuilder builder = new StringBuilder(digest.length * 2);
      for (byte b : digest) {
        builder.append(String.format("%02x", b & 0xff));
      }
      return builder.toString();
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to generate payment signature", ex);
    }
  }

  private int toPaise(BigDecimal totalAmount) {
    if (totalAmount == null || totalAmount.signum() <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order total must be greater than zero");
    }
    try {
      return totalAmount
          .multiply(BigDecimal.valueOf(100))
          .setScale(0, RoundingMode.HALF_UP)
          .intValueExact();
    } catch (ArithmeticException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order total is invalid", ex);
    }
  }

  private URI ordersApiUri() {
    String ordersApiUrl = appProperties.getRazorpay().getOrdersApiUrl();
    if (!hasText(ordersApiUrl)) {
      throw new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Razorpay orders API URL is not configured");
    }
    try {
      return URI.create(ordersApiUrl);
    } catch (IllegalArgumentException ex) {
      throw new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Razorpay orders API URL is not configured correctly",
          ex);
    }
  }

  private String basicAuthHeader() {
    String credentials = appProperties.getRazorpay().getKeyId()
        + ":"
        + appProperties.getRazorpay().getKeySecret();
    return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
  }

  private void requirePaymentCredentials() {
    if (!appProperties.getRazorpay().isEnabled()) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Razorpay checkout is disabled");
    }
    if (!hasText(appProperties.getRazorpay().getKeyId())
        || !hasText(appProperties.getRazorpay().getKeySecret())) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Razorpay API keys are not configured");
    }
  }

  private void requireWebhookSecret() {
    if (!appProperties.getRazorpay().isEnabled()) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Razorpay webhooks are disabled");
    }
    if (!hasText(appProperties.getRazorpay().getWebhookSecret())) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Razorpay webhook secret is not configured");
    }
  }

  private boolean constantTimeEquals(String expected, String provided) {
    return MessageDigest.isEqual(
        expected.getBytes(StandardCharsets.UTF_8),
        provided.getBytes(StandardCharsets.UTF_8));
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  public record RazorpayOrder(String id, int amountPaise, String currency, String keyId) {
  }
}
