package com.gadget69.catalog.config;

import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Utility class providing input sanitization and validation helpers.
 * Used across controllers to prevent XSS and injection attacks.
 */
public final class InputSanitizer {

  private InputSanitizer() {}

  // Matches script tags and event handlers from HTML
  private static final Pattern SCRIPT_PATTERN =
      Pattern.compile("<script[\\s\\S]*?</script>|javascript:|on\\w+\\s*=", Pattern.CASE_INSENSITIVE);

  // Common HTML tags that should be stripped from user input
  private static final Pattern HTML_TAG_PATTERN =
      Pattern.compile("<[^>]*>");

  // Phone: digits, spaces, hyphens, plus sign, parentheses only
  private static final Pattern PHONE_PATTERN =
      Pattern.compile("^[\\d\\s\\-\\+\\(\\)]{7,20}$");

  private static final Pattern EMAIL_PATTERN =
      Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$", Pattern.CASE_INSENSITIVE);

  // Indian pincode: exactly 6 digits
  private static final Pattern PINCODE_PATTERN =
      Pattern.compile("^\\d{6}$");

  // Check for SQL injection patterns
  private static final Pattern SQL_INJECTION_PATTERN =
      Pattern.compile("(?i)(;\\s*(drop|delete|truncate|insert|update|select|union|exec|execute|xp_))",
          Pattern.CASE_INSENSITIVE);

  /**
   * Strips script tags and HTML from a user-provided string.
   * Returns null if the input is null or blank.
   */
  public static String sanitize(String input) {
    if (input == null || input.isBlank()) {
      return null;
    }
    String stripped = SCRIPT_PATTERN.matcher(input).replaceAll("");
    stripped = HTML_TAG_PATTERN.matcher(stripped).replaceAll("");
    return stripped.trim();
  }

  /**
   * Sanitizes and validates that a string does not contain SQL injection patterns.
   */
  public static String sanitizeAndValidate(String input, String fieldName) {
    String sanitized = sanitize(input);
    if (sanitized != null && SQL_INJECTION_PATTERN.matcher(sanitized).find()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Invalid characters in field: " + fieldName);
    }
    return sanitized;
  }

  /**
   * Validates that a phone number matches an expected pattern.
   */
  public static void validatePhone(String phone) {
    if (phone == null || !PHONE_PATTERN.matcher(phone.trim()).matches()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Invalid phone number format. Use digits, spaces, hyphens, or + prefix.");
    }
  }

  public static void validateEmail(String email) {
    if (email == null || !EMAIL_PATTERN.matcher(email.trim()).matches()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email address.");
    }
  }

  /**
   * Validates that a pincode is exactly 6 digits.
   */
  public static void validatePincode(String pincode) {
    if (pincode == null || !PINCODE_PATTERN.matcher(pincode.trim()).matches()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Invalid pincode. Must be exactly 6 digits.");
    }
  }

  /**
   * Validates that customer name contains only safe characters.
   */
  public static void validateCustomerName(String name) {
    if (name == null || name.trim().length() < 2 || name.trim().length() > 100) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Customer name must be between 2 and 100 characters.");
    }
    if (SCRIPT_PATTERN.matcher(name).find()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Invalid characters in customer name.");
    }
  }
}
