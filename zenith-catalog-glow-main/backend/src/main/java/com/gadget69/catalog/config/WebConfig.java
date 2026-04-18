package com.gadget69.catalog.config;

import java.time.Duration;
import java.nio.file.Path;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

  private final AppProperties appProperties;

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")
        .allowedOrigins(appProperties.getAllowedOrigins().toArray(String[]::new))
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .allowedHeaders(
            "Authorization", "Content-Type", "Accept",
            "X-Requested-With", "Cache-Control")
        .exposedHeaders("Content-Disposition")
        .allowCredentials(false)
        .maxAge(3600);
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    Path uploadPath = Path.of(appProperties.getUploadDir()).toAbsolutePath().normalize();
    registry.addResourceHandler("/uploads/**")
        .addResourceLocations(uploadPath.toUri().toString())
        .setCacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic());
  }
}
