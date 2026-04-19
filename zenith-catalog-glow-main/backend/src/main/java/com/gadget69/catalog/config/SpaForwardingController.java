package com.gadget69.catalog.config;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Controller;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Controller
@RequiredArgsConstructor
public class SpaForwardingController {

  private final ResourceLoader resourceLoader;
  private final AppProperties appProperties;

  @GetMapping({
      "/{path:^(?!api$|uploads$|assets$)[^\\.]*}",
      "/{path:^(?!api$|uploads$|assets$)[^\\.]*}/**"
  })
  public String forward(HttpServletRequest request) {
    if (!hasBundledSpa()) {
      if (isLocalRequest(request) && StringUtils.hasText(appProperties.getFrontendDevUrl())) {
        return "redirect:" + buildDevServerUrl(request);
      }
      throw new ResponseStatusException(NOT_FOUND,
          "Frontend app is not bundled. Build the React app into backend static resources before opening this route.");
    }
    return "forward:/index.html";
  }

  private boolean hasBundledSpa() {
    Resource indexHtml = resourceLoader.getResource("classpath:/static/index.html");
    return indexHtml.exists();
  }

  private boolean isLocalRequest(HttpServletRequest request) {
    String serverName = request.getServerName();
    return "localhost".equalsIgnoreCase(serverName)
        || "127.0.0.1".equals(serverName)
        || "0:0:0:0:0:0:0:1".equals(serverName)
        || "::1".equals(serverName);
  }

  private String buildDevServerUrl(HttpServletRequest request) {
    String baseUrl = appProperties.getFrontendDevUrl().replaceAll("/+$", "");
    String queryString = request.getQueryString();
    if (StringUtils.hasText(queryString)) {
      return baseUrl + request.getRequestURI() + "?" + queryString;
    }
    return baseUrl + request.getRequestURI();
  }
}
