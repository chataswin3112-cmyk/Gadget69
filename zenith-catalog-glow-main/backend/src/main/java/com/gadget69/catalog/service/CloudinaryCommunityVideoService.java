package com.gadget69.catalog.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.gadget69.catalog.config.AppProperties;
import com.gadget69.catalog.dto.ApiDtos;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CloudinaryCommunityVideoService {

  private static final String RESOURCE_TYPE = "video";

  private final AppProperties appProperties;

  public ApiDtos.CommunityVideoUploadSignatureResponse createUploadSignature(
      ApiDtos.CommunityVideoUploadSignatureRequest request) {
    AppProperties.Cloudinary config = requireConfigured();
    validateUploadRequest(request);

    long timestamp = Instant.now().getEpochSecond();
    String folder = sanitizeFolder(config.getCommunityVideoFolder());
    Map<String, Object> signedParams = new LinkedHashMap<>(ObjectUtils.asMap(
        "folder", folder,
        "timestamp", timestamp
    ));
    cloudinary(config).signRequest(signedParams, Map.of());
    String signature = String.valueOf(signedParams.get("signature"));

    return new ApiDtos.CommunityVideoUploadSignatureResponse(
        config.getCloudName(),
        config.getApiKey(),
        timestamp,
        signature,
        folder,
        RESOURCE_TYPE
    );
  }

  public String buildPosterUrl(String publicId) {
    if (publicId == null || publicId.isBlank()) {
      return null;
    }

    AppProperties.Cloudinary config = requireConfigured();
    String protocol = config.isSecure() ? "https" : "http";
    String normalizedPublicId = encodePublicId(publicId);

    return protocol + "://res.cloudinary.com/"
        + config.getCloudName()
        + "/video/upload/c_fill,g_auto,h_720,w_1280,so_0/"
        + normalizedPublicId
        + ".jpg";
  }

  private void validateUploadRequest(ApiDtos.CommunityVideoUploadSignatureRequest request) {
    if (request == null || request.fileName() == null || request.fileName().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Video filename is required");
    }
    if (request.contentType() != null
        && !request.contentType().isBlank()
        && !request.contentType().toLowerCase().startsWith("video/")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only video uploads are allowed");
    }
  }

  private AppProperties.Cloudinary requireConfigured() {
    AppProperties.Cloudinary config = appProperties.getCloudinary();
    if (config == null
        || isBlank(config.getCloudName())
        || isBlank(config.getApiKey())
        || isBlank(config.getApiSecret())) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "Cloudinary community video upload is not configured"
      );
    }
    return config;
  }

  private Cloudinary cloudinary(AppProperties.Cloudinary config) {
    return new Cloudinary(ObjectUtils.asMap(
        "cloud_name", config.getCloudName(),
        "api_key", config.getApiKey(),
        "api_secret", config.getApiSecret(),
        "secure", config.isSecure()
    ));
  }

  private String sanitizeFolder(String folder) {
    if (folder == null || folder.isBlank()) {
      return "gadget69/community/videos";
    }
    return folder.trim().replaceAll("^/+", "").replaceAll("/+$", "");
  }

  private String encodePublicId(String publicId) {
    String[] segments = publicId.trim().split("/");
    StringBuilder builder = new StringBuilder();
    for (int index = 0; index < segments.length; index++) {
      if (segments[index].isBlank()) {
        continue;
      }
      if (builder.length() > 0) {
        builder.append("/");
      }
      builder.append(URLEncoder.encode(segments[index], StandardCharsets.UTF_8).replace("+", "%20"));
    }
    return builder.toString();
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
