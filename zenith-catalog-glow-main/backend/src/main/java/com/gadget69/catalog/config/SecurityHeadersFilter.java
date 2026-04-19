package com.gadget69.catalog.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Adds HTTP security headers to every response to harden against common web attacks:
 * XSS, clickjacking, MIME sniffing, and information leakage.
 */
@Component
@Order(1)
public class SecurityHeadersFilter extends OncePerRequestFilter {

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {

    // Prevent the page from being framed (clickjacking protection)
    response.setHeader("X-Frame-Options", "DENY");

    // Prevent MIME-type sniffing
    response.setHeader("X-Content-Type-Options", "nosniff");

    // XSS filter hint for older browsers
    response.setHeader("X-XSS-Protection", "1; mode=block");

    // Control referrer information leaked to external sites
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Allow the minimal browser features Razorpay uses inside its checkout frame.
    response.setHeader("Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), "
            + "accelerometer=(self \"https://checkout.razorpay.com\" \"https://api.razorpay.com\"), "
            + "gyroscope=(self \"https://checkout.razorpay.com\" \"https://api.razorpay.com\"), "
            + "magnetometer=(self \"https://checkout.razorpay.com\" \"https://api.razorpay.com\"), "
            + "payment=(self \"https://checkout.razorpay.com\" \"https://api.razorpay.com\")");

    // Keep a tight policy, but include the current Razorpay asset hosts used by checkout.
    response.setHeader("Content-Security-Policy",
        "default-src 'self'; "
            + "img-src 'self' data: https: blob:; "
            + "media-src 'self' https: blob:; "
            + "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com; "
            + "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com; "
            + "font-src 'self' https://fonts.gstatic.com https://api.fontshare.com https://cdn.fontshare.com data:; "
            + "connect-src 'self' https: wss://*.sardine.ai; "
            + "frame-src https://api.razorpay.com https://checkout.razorpay.com; "
            + "object-src 'none'; "
            + "base-uri 'self';");

    // HTTP Strict Transport Security (HTTPS enforcement — active on HTTPS deployments)
    response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

    // Hide server technology information
    response.setHeader("Server", "");
    response.setHeader("X-Powered-By", "");

    filterChain.doFilter(request, response);
  }
}
