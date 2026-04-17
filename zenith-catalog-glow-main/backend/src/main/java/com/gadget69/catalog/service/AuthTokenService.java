package com.gadget69.catalog.service;

import com.gadget69.catalog.config.AppProperties;
import com.gadget69.catalog.entity.AdminUser;
import com.gadget69.catalog.repository.AdminUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Base64;
import java.util.regex.Pattern;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthTokenService {

  private final AppProperties appProperties;
  private final AdminUserRepository adminUserRepository;
  private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  // Password strength pattern: 8+ chars, uppercase, lowercase, digit, special char
  private static final Pattern PASSWORD_PATTERN =
      Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+=\\-]).{8,}$");

  public String login(String email, String password) {
    AdminUser adminUser = adminUserRepository.findByEmailIgnoreCase(email == null ? "" : email.trim())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

    // Strict BCrypt-only check — no backdoor allowed
    if (!passwordEncoder.matches(password == null ? "" : password, adminUser.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    return createToken(adminUser);
  }

  public void changePassword(AdminUser adminUser, String currentPassword, String newPassword) {
    if (!passwordEncoder.matches(currentPassword == null ? "" : currentPassword, adminUser.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
    }
    validatePasswordStrength(newPassword);
    adminUser.setPasswordHash(passwordEncoder.encode(newPassword));
    // Rotate token version to invalidate all existing sessions
    adminUser.setTokenVersion((adminUser.getTokenVersion() == null ? 0 : adminUser.getTokenVersion()) + 1);
    adminUserRepository.save(adminUser);
  }

  public AdminUser requireAdmin(HttpServletRequest request) {
    String authorization = request.getHeader("Authorization");
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing admin token");
    }
    return parseToken(authorization.substring(7));
  }

  public String encodePassword(String rawPassword) {
    return passwordEncoder.encode(rawPassword);
  }

  public void forceChangePassword(AdminUser adminUser, String newPassword) {
    validatePasswordStrength(newPassword);
    adminUser.setPasswordHash(passwordEncoder.encode(newPassword));
    // Rotate token version to invalidate all existing sessions
    adminUser.setTokenVersion((adminUser.getTokenVersion() == null ? 0 : adminUser.getTokenVersion()) + 1);
    adminUserRepository.save(adminUser);
  }

  /** Validates password meets strength requirements */
  private void validatePasswordStrength(String password) {
    if (password == null || password.length() < 8) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Password must be at least 8 characters long");
    }
    if (!PASSWORD_PATTERN.matcher(password).matches()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#^()_+=-)");
    }
  }

  /** Default fallback secret — matches the application.yml default value. */
  private static final String FALLBACK_ADMIN_SECRET = "change-this-secret-before-production";

  public AdminUser resetPasswordWithSecretKey(String secretKey, String newPassword) {
    if (secretKey == null || secretKey.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Secret key is required");
    }
    if (newPassword == null || newPassword.length() < 6) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters");
    }
    // Resolve configured secret with null-safe fallback to prevent NPE
    String configuredSecret = (appProperties.getAdminSecret() != null && !appProperties.getAdminSecret().isBlank())
        ? appProperties.getAdminSecret()
        : FALLBACK_ADMIN_SECRET;
    // Constant-time comparison to prevent timing attacks
    byte[] expectedBytes = configuredSecret.getBytes(StandardCharsets.UTF_8);
    byte[] providedBytes = secretKey.getBytes(StandardCharsets.UTF_8);
    // Pad shorter array to same length before constant-time compare (avoids length leak)
    int maxLen = Math.max(expectedBytes.length, providedBytes.length);
    byte[] paddedExpected = java.util.Arrays.copyOf(expectedBytes, maxLen);
    byte[] paddedProvided = java.util.Arrays.copyOf(providedBytes, maxLen);
    boolean keyMatches = MessageDigest.isEqual(paddedExpected, paddedProvided)
        && expectedBytes.length == providedBytes.length;
    if (!keyMatches) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid secret key");
    }
    AdminUser adminUser = adminUserRepository.findAll().stream().findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin user not found"));
    validatePasswordStrength(newPassword);
    adminUser.setPasswordHash(passwordEncoder.encode(newPassword));
    // Rotate token version to invalidate all existing sessions after reset
    adminUser.setTokenVersion((adminUser.getTokenVersion() == null ? 0 : adminUser.getTokenVersion()) + 1);
    adminUserRepository.save(adminUser);
    return adminUser;
  }

  private String createToken(AdminUser adminUser) {
    long expiresAt = System.currentTimeMillis()
        + Duration.ofHours(appProperties.getAdminTokenHours()).toMillis();
    int tokenVersion = adminUser.getTokenVersion() == null ? 0 : adminUser.getTokenVersion();
    // Include token version so password change invalidates old tokens
    String payload = adminUser.getId() + ":" + adminUser.getEmail() + ":" + expiresAt + ":" + tokenVersion;
    String signature = sign(payload);
    String tokenValue = payload + ":" + signature;
    return Base64.getUrlEncoder().withoutPadding()
        .encodeToString(tokenValue.getBytes(StandardCharsets.UTF_8));
  }

  private AdminUser parseToken(String token) {
    try {
      String decoded = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
      // Format: id:email:expiresAt:tokenVersion:signature
      String[] parts = decoded.split(":", 5);
      if (parts.length != 5) {
        throw unauthorized();
      }

      Long adminId = Long.parseLong(parts[0]);
      String email = parts[1];
      long expiresAt = Long.parseLong(parts[2]);
      int tokenVersion = Integer.parseInt(parts[3]);
      String signature = parts[4];
      String payload = parts[0] + ":" + parts[1] + ":" + parts[2] + ":" + parts[3];

      if (expiresAt < System.currentTimeMillis()) {
        throw unauthorized();
      }

      if (!MessageDigest.isEqual(sign(payload).getBytes(StandardCharsets.UTF_8),
          signature.getBytes(StandardCharsets.UTF_8))) {
        throw unauthorized();
      }

      AdminUser adminUser = adminUserRepository.findById(adminId).orElseThrow(this::unauthorized);
      if (!adminUser.getEmail().equalsIgnoreCase(email)) {
        throw unauthorized();
      }
      // Verify token version matches — rejects tokens issued before password change
      int currentVersion = adminUser.getTokenVersion() == null ? 0 : adminUser.getTokenVersion();
      if (tokenVersion != currentVersion) {
        throw unauthorized();
      }
      return adminUser;
    } catch (IllegalArgumentException ex) {
      throw unauthorized();
    }
  }

  private String sign(String value) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(appProperties.getAdminSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      byte[] digest = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to sign admin token", ex);
    }
  }

  private ResponseStatusException unauthorized() {
    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired admin token");
  }
}
