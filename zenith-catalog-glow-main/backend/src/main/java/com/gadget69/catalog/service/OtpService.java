package com.gadget69.catalog.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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

@Slf4j
@Service
public class OtpService {

    // Admin WhatsApp number (hardcoded for security)
    private static final String ADMIN_PHONE = "918825602356";
    private static final int OTP_EXPIRY_SECONDS = 300; // 5 minutes
    private static final int OTP_LENGTH = 6;

    @Value("${app.twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${app.twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${app.twilio.whatsapp-from:whatsapp:+14155238886}")
    private String twilioWhatsappFrom;

    // In-memory OTP store: phone -> {otp, expiryEpochSecond}
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    public void sendPasswordOtp() {
        String otp = generateOtp();
        long expiry = Instant.now().getEpochSecond() + OTP_EXPIRY_SECONDS;
        otpStore.put(ADMIN_PHONE, new OtpEntry(otp, expiry));

        String message = "🔐 Gadget69 Admin\n\nYour OTP to change password is:\n\n*" + otp + "*\n\nThis OTP expires in 5 minutes. Do not share it with anyone.";

        boolean sent = sendWhatsApp(ADMIN_PHONE, message);
        if (!sent) {
            // Log OTP to console as fallback (local testing)
            log.warn("============================================");
            log.warn("WhatsApp not configured. OTP for testing: {}", otp);
            log.warn("============================================");
        }
    }

    public void verifyOtpAndChangePassword(String submittedOtp, String newPassword,
                                            com.gadget69.catalog.entity.AdminUser adminUser,
                                            AuthTokenService authTokenService) {
        OtpEntry entry = otpStore.get(ADMIN_PHONE);
        if (entry == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No OTP requested. Please request a new OTP.");
        }
        if (Instant.now().getEpochSecond() > entry.expiryEpochSecond()) {
            otpStore.remove(ADMIN_PHONE);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP has expired. Please request a new one.");
        }
        if (!entry.otp().equals(submittedOtp.trim())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid OTP. Please check and try again.");
        }
        // OTP valid — change password
        otpStore.remove(ADMIN_PHONE);
        authTokenService.forceChangePassword(adminUser, newPassword);
    }

    private String generateOtp() {
        int n = secureRandom.nextInt(900000) + 100000;
        return String.valueOf(n);
    }

    private boolean sendWhatsApp(String toPhone, String message) {
        if (twilioAccountSid == null || twilioAccountSid.isBlank() ||
                twilioAuthToken == null || twilioAuthToken.isBlank()) {
            return false;
        }
        try {
            String url = "https://api.twilio.com/2010-04-01/Accounts/" + twilioAccountSid + "/Messages.json";
            String body = "From=" + URLEncoder.encode(twilioWhatsappFrom, StandardCharsets.UTF_8)
                    + "&To=" + URLEncoder.encode("whatsapp:+" + toPhone, StandardCharsets.UTF_8)
                    + "&Body=" + URLEncoder.encode(message, StandardCharsets.UTF_8);

            String auth = Base64.getEncoder().encodeToString(
                    (twilioAccountSid + ":" + twilioAuthToken).getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Basic " + auth)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("WhatsApp OTP sent successfully to +{}", toPhone);
                return true;
            } else {
                log.warn("Twilio error {}: {}", response.statusCode(), response.body());
                return false;
            }
        } catch (Exception ex) {
            log.error("Failed to send WhatsApp OTP: {}", ex.getMessage());
            return false;
        }
    }

    private record OtpEntry(String otp, long expiryEpochSecond) {}
}
