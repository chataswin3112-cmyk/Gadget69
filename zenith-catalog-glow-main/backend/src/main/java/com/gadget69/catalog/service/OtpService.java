package com.gadget69.catalog.service;

import com.gadget69.catalog.entity.AdminUser;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
public class OtpService {

  private static final int OTP_EXPIRY_SECONDS = 300;
  private static final int OTP_LENGTH = 6;

  @Value("${app.twilio.account-sid:}")
  private String twilioAccountSid;

  @Value("${app.twilio.auth-token:}")
  private String twilioAuthToken;

  @Value("${app.twilio.whatsapp-from:whatsapp:+14155238886}")
  private String twilioWhatsappFrom;

  // In-memory OTP store keyed by the authenticated admin identity.
  private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
  private final SecureRandom secureRandom = new SecureRandom();

  public OtpDispatchResult sendPasswordOtp(AdminUser adminUser, String destinationPhone) {
    String adminKey = resolveAdminKey(adminUser);
    String normalizedPhone = normalizePhoneNumber(destinationPhone);
    if (normalizedPhone == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Save a WhatsApp number in Settings before requesting an OTP.");
    }
    if (!isTwilioConfigured()) {
      throw new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "WhatsApp OTP delivery is not configured. Add APP_TWILIO_ACCOUNT_SID, "
              + "APP_TWILIO_AUTH_TOKEN, and APP_TWILIO_WHATSAPP_FROM.");
    }

    String otp = generateOtp();
    String message =
        "Gadget69 Admin\n\nYour OTP to change password is:\n\n*"
            + otp
            + "*\n\nThis OTP expires in 5 minutes. Do not share it with anyone.";

    if (!sendWhatsApp(normalizedPhone, message)) {
      throw new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Unable to send the OTP to the registered WhatsApp number. Check Twilio credentials, "
              + "WhatsApp sender approval, and the saved number format.");
    }

    long expiry = Instant.now().getEpochSecond() + OTP_EXPIRY_SECONDS;
    otpStore.put(adminKey, new OtpEntry(otp, expiry, normalizedPhone));
    return new OtpDispatchResult(
        "OTP sent to your registered WhatsApp number. Valid for 5 minutes.",
        formatPhoneNumber(normalizedPhone));
  }

  public void verifyOtpAndChangePassword(
      String submittedOtp,
      String newPassword,
      AdminUser adminUser,
      AuthTokenService authTokenService) {
    String adminKey = resolveAdminKey(adminUser);
    OtpEntry entry = otpStore.get(adminKey);
    if (entry == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "No OTP requested. Please request a new OTP.");
    }
    if (Instant.now().getEpochSecond() > entry.expiryEpochSecond()) {
      otpStore.remove(adminKey);
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "OTP has expired. Please request a new one.");
    }
    if (!entry.otp().equals(submittedOtp.trim())) {
      throw new ResponseStatusException(
          HttpStatus.UNAUTHORIZED, "Invalid OTP. Please check and try again.");
    }

    otpStore.remove(adminKey);
    authTokenService.forceChangePassword(adminUser, newPassword);
  }

  private String generateOtp() {
    int lowerBound = (int) Math.pow(10, OTP_LENGTH - 1);
    int otp = secureRandom.nextInt(lowerBound * 9) + lowerBound;
    return String.valueOf(otp);
  }

  protected boolean sendWhatsApp(String toPhone, String message) {
    try {
      String url =
          "https://api.twilio.com/2010-04-01/Accounts/" + twilioAccountSid + "/Messages.json";
      String body =
          "From="
              + URLEncoder.encode(twilioWhatsappFrom, StandardCharsets.UTF_8)
              + "&To="
              + URLEncoder.encode("whatsapp:+" + toPhone, StandardCharsets.UTF_8)
              + "&Body="
              + URLEncoder.encode(message, StandardCharsets.UTF_8);

      String auth =
          Base64.getEncoder()
              .encodeToString(
                  (twilioAccountSid + ":" + twilioAuthToken).getBytes(StandardCharsets.UTF_8));

      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(URI.create(url))
              .header("Authorization", "Basic " + auth)
              .header("Content-Type", "application/x-www-form-urlencoded")
              .POST(HttpRequest.BodyPublishers.ofString(body))
              .build();

      HttpResponse<String> response =
          HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() >= 200 && response.statusCode() < 300) {
        log.info("WhatsApp OTP sent successfully to {}", formatPhoneNumber(toPhone));
        return true;
      }

      log.warn("Twilio error {}: {}", response.statusCode(), response.body());
      return false;
    } catch (Exception ex) {
      log.error("Failed to send WhatsApp OTP: {}", ex.getMessage());
      return false;
    }
  }

  private boolean isTwilioConfigured() {
    return twilioAccountSid != null
        && !twilioAccountSid.isBlank()
        && twilioAuthToken != null
        && !twilioAuthToken.isBlank()
        && twilioWhatsappFrom != null
        && !twilioWhatsappFrom.isBlank();
  }

  private String resolveAdminKey(AdminUser adminUser) {
    if (adminUser.getId() != null) {
      return "admin:" + adminUser.getId();
    }
    return "admin:" + adminUser.getEmail().trim().toLowerCase();
  }

  private String normalizePhoneNumber(String rawPhoneNumber) {
    if (rawPhoneNumber == null || rawPhoneNumber.isBlank()) {
      return null;
    }

    String digitsOnly = rawPhoneNumber.replaceAll("[^\\d]", "");
    if (digitsOnly.length() == 10) {
      return "91" + digitsOnly;
    }
    if (digitsOnly.length() < 11 || digitsOnly.length() > 15) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "The saved WhatsApp number must include a valid mobile number with country code.");
    }
    return digitsOnly;
  }

  private String formatPhoneNumber(String normalizedPhoneNumber) {
    if (normalizedPhoneNumber == null || normalizedPhoneNumber.isBlank()) {
      return "your registered WhatsApp number";
    }
    if (normalizedPhoneNumber.length() == 12 && normalizedPhoneNumber.startsWith("91")) {
      return "+91 "
          + normalizedPhoneNumber.substring(2, 7)
          + " "
          + normalizedPhoneNumber.substring(7);
    }
    return "+" + normalizedPhoneNumber;
  }

  public record OtpDispatchResult(String message, String recipient) {}

  private record OtpEntry(String otp, long expiryEpochSecond, String recipientPhone) {}
}
