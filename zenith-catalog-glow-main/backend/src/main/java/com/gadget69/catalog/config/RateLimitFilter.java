package com.gadget69.catalog.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Brute-force protection filter for the admin login endpoint.
 * Limits each IP to MAX_ATTEMPTS login attempts per WINDOW_MINUTES.
 * Returns HTTP 429 Too Many Requests when the limit is exceeded.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

  private static final String LOGIN_PATH = "/api/admin/login";
  private static final int MAX_ATTEMPTS = 5;
  private static final long WINDOW_MINUTES = 15;

  private record AttemptRecord(AtomicInteger count, Instant windowStart) {}

  private final Map<String, AttemptRecord> attempts = new ConcurrentHashMap<>();
  private final ScheduledExecutorService cleaner = Executors.newSingleThreadScheduledExecutor();

  public RateLimitFilter() {
    // Clean up stale entries every 15 minutes
    cleaner.scheduleAtFixedRate(this::cleanup, WINDOW_MINUTES, WINDOW_MINUTES, TimeUnit.MINUTES);
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    // Only rate-limit POST /api/admin/login
    return !("POST".equalsIgnoreCase(request.getMethod())
        && LOGIN_PATH.equals(request.getServletPath()));
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {

    String ip = resolveClientIp(request);
    AttemptRecord record = attempts.compute(ip, (key, existing) -> {
      if (existing == null
          || Instant.now().isAfter(existing.windowStart().plusSeconds(WINDOW_MINUTES * 60))) {
        return new AttemptRecord(new AtomicInteger(0), Instant.now());
      }
      return existing;
    });

    int current = record.count().incrementAndGet();
    if (current > MAX_ATTEMPTS) {
      long retryAfterSeconds = WINDOW_MINUTES * 60;
      response.setStatus(429);
      response.setContentType(MediaType.APPLICATION_JSON_VALUE);
      response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
      response.getWriter().write(
          "{\"error\":\"Too many login attempts. Please wait " + WINDOW_MINUTES
              + " minutes before trying again.\",\"status\":429}");
      return;
    }

    filterChain.doFilter(request, response);
    if (response.getStatus() < HttpServletResponse.SC_BAD_REQUEST) {
      attempts.remove(ip);
    }
  }

  private String resolveClientIp(HttpServletRequest request) {
    String xForwardedFor = request.getHeader("X-Forwarded-For");
    if (xForwardedFor != null && !xForwardedFor.isBlank()) {
      // Take the first (original client) IP from the chain
      return xForwardedFor.split(",")[0].trim();
    }
    String xRealIp = request.getHeader("X-Real-IP");
    if (xRealIp != null && !xRealIp.isBlank()) {
      return xRealIp.trim();
    }
    return request.getRemoteAddr();
  }

  private void cleanup() {
    Instant cutoff = Instant.now().minusSeconds(WINDOW_MINUTES * 60);
    attempts.entrySet().removeIf(e -> e.getValue().windowStart().isBefore(cutoff));
  }
}
