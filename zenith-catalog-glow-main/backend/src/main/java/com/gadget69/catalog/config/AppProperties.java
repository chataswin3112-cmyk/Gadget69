package com.gadget69.catalog.config;

import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class AppProperties {
  private String uploadDir = "./uploads";
  private String publicBaseUrl = "http://localhost:8081";
  private String frontendDevUrl = "http://localhost:8080";
  private String adminSecret = "change-this-secret-before-production";
  private long adminTokenHours = 24;
  private List<String> allowedOrigins = new ArrayList<>();
  private Cloudinary cloudinary = new Cloudinary();

  @Getter
  @Setter
  public static class Cloudinary {
    private String cloudName;
    private String apiKey;
    private String apiSecret;
    private String communityVideoFolder = "gadget69/community/videos";
    private boolean secure = true;
  }
}
