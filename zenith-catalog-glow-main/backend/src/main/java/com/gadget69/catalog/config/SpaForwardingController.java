package com.gadget69.catalog.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Controller
public class SpaForwardingController {

  @GetMapping({"/{path:[^\\.]*}", "/**/{path:[^\\.]*}"})
  public String forward(HttpServletRequest request) {
    String uri = request.getRequestURI();
    if (uri.startsWith("/api") || uri.startsWith("/uploads")) {
      throw new ResponseStatusException(NOT_FOUND);
    }
    return "forward:/index.html";
  }
}
