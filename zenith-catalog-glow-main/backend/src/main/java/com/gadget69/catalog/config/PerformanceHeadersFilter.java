package com.gadget69.catalog.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(2)
public class PerformanceHeadersFilter extends OncePerRequestFilter {

  private static final String IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
  private static final String SHORT_PUBLIC_API_CACHE =
      "public, max-age=60, stale-while-revalidate=300";
  private static final String SPA_DOCUMENT_CACHE = "no-cache";

  private static final Set<String> PUBLIC_CATALOG_ENDPOINTS = Set.of(
      "/api/banners",
      "/api/community-media",
      "/api/health",
      "/api/products",
      "/api/reviews",
      "/api/sections",
      "/api/settings",
      "/api/storefront/bootstrap"
  );

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    if (isCacheableMethod(request)) {
      String uri = request.getRequestURI();
      if (isImmutableStaticAsset(uri)) {
        setHeaderIfAbsent(response, HttpHeaders.CACHE_CONTROL, IMMUTABLE_CACHE);
      } else if (isPublicCatalogEndpoint(uri)) {
        setHeaderIfAbsent(response, HttpHeaders.CACHE_CONTROL, SHORT_PUBLIC_API_CACHE);
      } else if (isSpaDocument(uri)) {
        setHeaderIfAbsent(response, HttpHeaders.CACHE_CONTROL, SPA_DOCUMENT_CACHE);
      }

      addVaryIfMissing(response, HttpHeaders.ACCEPT_ENCODING);
    }

    filterChain.doFilter(request, response);
  }

  private boolean isCacheableMethod(HttpServletRequest request) {
    String method = request.getMethod();
    return "GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method);
  }

  private boolean isImmutableStaticAsset(String uri) {
    return uri.startsWith("/assets/")
        || uri.startsWith("/fonts/")
        || uri.startsWith("/uploads/")
        || uri.endsWith(".webp")
        || uri.endsWith(".avif")
        || uri.endsWith(".woff2");
  }

  private boolean isPublicCatalogEndpoint(String uri) {
    return PUBLIC_CATALOG_ENDPOINTS.contains(uri)
        || uri.matches("^/api/products/\\d+$")
        || uri.matches("^/api/variants/\\d+$");
  }

  private boolean isSpaDocument(String uri) {
    return "/".equals(uri) || "/index.html".equals(uri) || (!uri.startsWith("/api/") && !uri.contains("."));
  }

  private void setHeaderIfAbsent(HttpServletResponse response, String name, String value) {
    if (!response.containsHeader(name)) {
      response.setHeader(name, value);
    }
  }

  private void addVaryIfMissing(HttpServletResponse response, String value) {
    for (String existingValue : response.getHeaders(HttpHeaders.VARY)) {
      if (existingValue.equalsIgnoreCase(value) || existingValue.toLowerCase().contains(value.toLowerCase())) {
        return;
      }
    }
    response.addHeader(HttpHeaders.VARY, value);
  }
}
