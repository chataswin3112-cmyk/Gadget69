package com.gadget69.catalog.service;

import com.gadget69.catalog.config.AppProperties;
import com.gadget69.catalog.entity.AdminUser;
import com.gadget69.catalog.repository.AdminUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Base64;
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

  public String login(String email, String password) {
    AdminUser adminUser = adminUserRepository.findByEmailIgnoreCase(email == null ? "" : email.trim())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

    if (!passwordEncoder.matches(password == null ? "" : password, adminUser.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    return createToken(adminUser);
  }

  public void changePassword(AdminUser adminUser, String currentPassword, String newPassword) {
    if (!passwordEncoder.matches(currentPassword == null ? "" : currentPassword, adminUser.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
    }
    adminUser.setPasswordHash(passwordEncoder.encode(newPassword == null ? "" : newPassword));
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
    if (newPassword == null || newPassword.length() < 6) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters");
    }
    adminUser.setPasswordHash(passwordEncoder.encode(newPassword));
    adminUserRepository.save(adminUser);
  }

  private String createToken(AdminUser adminUser) {
    long expiresAt = System.currentTimeMillis()
        + Duration.ofHours(appProperties.getAdminTokenHours()).toMillis();
    String payload = adminUser.getId() + ":" + adminUser.getEmail() + ":" + expiresAt;
    String signature = sign(payload);
    String tokenValue = payload + ":" + signature;
    return Base64.getUrlEncoder().withoutPadding()
        .encodeToString(tokenValue.getBytes(StandardCharsets.UTF_8));
  }

  private AdminUser parseToken(String token) {
    try {
      String decoded = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
      String[] parts = decoded.split(":", 4);
      if (parts.length != 4) {
        throw unauthorized();
      }

      Long adminId = Long.parseLong(parts[0]);
      String email = parts[1];
      long expiresAt = Long.parseLong(parts[2]);
      String signature = parts[3];
      String payload = parts[0] + ":" + parts[1] + ":" + parts[2];

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
