package com.gadget69.catalog.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.gadget69.catalog.entity.AdminUser;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

class OtpServiceTest {

  private static final Pattern OTP_PATTERN = Pattern.compile("\\b(\\d{6})\\b");

  @Test
  void sendsOtpToNormalizedWhatsappNumberAndUsesAdminScopedVerification() {
    TestOtpService otpService = new TestOtpService();
    otpService.setTwilioConfigured();

    AdminUser adminUser = new AdminUser();
    adminUser.setId(7L);
    adminUser.setEmail("admin@gadget69.com");

    OtpService.OtpDispatchResult dispatchResult =
        otpService.sendPasswordOtp(adminUser, "88256 02356");

    assertEquals("+91 88256 02356", dispatchResult.recipient());
    assertEquals("918825602356", otpService.lastPhoneNumber);

    AuthTokenService authTokenService = mock(AuthTokenService.class);
    otpService.verifyOtpAndChangePassword(extractOtp(otpService.lastMessage), "next-password", adminUser, authTokenService);

    verify(authTokenService).forceChangePassword(adminUser, "next-password");
  }

  @Test
  void rejectsOtpRequestsWhenNoWhatsappNumberIsSaved() {
    TestOtpService otpService = new TestOtpService();
    otpService.setTwilioConfigured();

    AdminUser adminUser = new AdminUser();
    adminUser.setEmail("admin@gadget69.com");

    ResponseStatusException exception =
        assertThrows(ResponseStatusException.class, () -> otpService.sendPasswordOtp(adminUser, " "));

    assertEquals("Save a WhatsApp number in Settings before requesting an OTP.", exception.getReason());
  }

  @Test
  void rejectsOtpRequestsWhenTwilioIsNotConfigured() {
    TestOtpService otpService = new TestOtpService();

    AdminUser adminUser = new AdminUser();
    adminUser.setEmail("admin@gadget69.com");

    ResponseStatusException exception =
        assertThrows(ResponseStatusException.class, () -> otpService.sendPasswordOtp(adminUser, "+91 88256 02356"));

    assertEquals(
        "WhatsApp OTP delivery is not configured. Add APP_TWILIO_ACCOUNT_SID, APP_TWILIO_AUTH_TOKEN, and APP_TWILIO_WHATSAPP_FROM.",
        exception.getReason());
  }

  private String extractOtp(String message) {
    Matcher matcher = OTP_PATTERN.matcher(message);
    if (!matcher.find()) {
      throw new AssertionError("Expected OTP in message: " + message);
    }
    return matcher.group(1);
  }

  private static final class TestOtpService extends OtpService {
    private String lastPhoneNumber;
    private String lastMessage;

    @Override
    protected boolean sendWhatsApp(String toPhone, String message) {
      lastPhoneNumber = toPhone;
      lastMessage = message;
      return true;
    }

    private void setTwilioConfigured() {
      ReflectionTestUtils.setField(this, "twilioAccountSid", "test-sid");
      ReflectionTestUtils.setField(this, "twilioAuthToken", "test-token");
      ReflectionTestUtils.setField(this, "twilioWhatsappFrom", "whatsapp:+14155238886");
    }
  }
}
