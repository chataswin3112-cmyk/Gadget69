package com.gadget69.catalog.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.gadget69.catalog.config.AppProperties;
import com.gadget69.catalog.dto.ApiDtos;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CloudinaryCatalogMediaService {

  private final AppProperties appProperties;

  public ApiDtos.CatalogMediaUploadSignatureResponse createUploadSignature(
      ApiDtos.CatalogMediaUploadSignatureRequest request) {
    AppProperties.Cloudinary config = requireConfigured();
    UploadTarget uploadTarget = UploadTarget.from(request == null ? null : request.target());
    MediaKind mediaKind = MediaKind.from(request == null ? null : request.contentType(), request == null ? null : request.fileName());
    validateUploadRequest(request, mediaKind);

    long timestamp = Instant.now().getEpochSecond();
    String folder = resolveFolder(config, uploadTarget, mediaKind);
    Map<String, Object> signedParams = new LinkedHashMap<>(ObjectUtils.asMap(
        "folder", folder,
        "timestamp", timestamp
    ));
    cloudinary(config).signRequest(signedParams, Map.of());

    return new ApiDtos.CatalogMediaUploadSignatureResponse(
        config.getCloudName(),
        config.getApiKey(),
        timestamp,
        String.valueOf(signedParams.get("signature")),
        folder,
        mediaKind.resourceType
    );
  }

  private void validateUploadRequest(ApiDtos.CatalogMediaUploadSignatureRequest request, MediaKind mediaKind) {
    if (request == null || isBlank(request.fileName())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Filename is required");
    }

    long fileSize = request.fileSize() == null ? 0L : request.fileSize();
    long maxBytes = mediaKind == MediaKind.VIDEO ? 50L * 1024 * 1024 : 10L * 1024 * 1024;
    if (fileSize > maxBytes) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          mediaKind == MediaKind.VIDEO ? "Video must be 50 MB or smaller" : "Image must be 10 MB or smaller");
    }
  }

  private String resolveFolder(AppProperties.Cloudinary config, UploadTarget target, MediaKind mediaKind) {
    return switch (target) {
      case PRODUCT -> sanitizeFolder(mediaKind == MediaKind.VIDEO
          ? config.getProductVideoFolder()
          : config.getProductImageFolder());
      case VARIANT -> sanitizeFolder(mediaKind == MediaKind.VIDEO
          ? config.getVariantVideoFolder()
          : config.getVariantImageFolder());
      case CATEGORY -> {
        if (mediaKind == MediaKind.VIDEO) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category uploads only support images");
        }
        yield sanitizeFolder(config.getCategoryImageFolder());
      }
    };
  }

  private AppProperties.Cloudinary requireConfigured() {
    AppProperties.Cloudinary config = appProperties.getCloudinary();
    if (config == null
        || isBlank(config.getCloudName())
        || isBlank(config.getApiKey())
        || isBlank(config.getApiSecret())) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "Cloudinary catalog media upload is not configured");
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
      return "gadget69/catalog";
    }
    return folder.trim().replaceAll("^/+", "").replaceAll("/+$", "");
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }

  private enum UploadTarget {
    PRODUCT,
    VARIANT,
    CATEGORY;

    private static UploadTarget from(String value) {
      if (value == null || value.isBlank()) {
        return PRODUCT;
      }
      try {
        return UploadTarget.valueOf(value.trim().toUpperCase(Locale.ROOT));
      } catch (IllegalArgumentException ex) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Upload target must be PRODUCT, VARIANT, or CATEGORY");
      }
    }
  }

  private enum MediaKind {
    IMAGE("image"),
    VIDEO("video");

    private final String resourceType;

    MediaKind(String resourceType) {
      this.resourceType = resourceType;
    }

    private static MediaKind from(String contentType, String fileName) {
      String normalizedContentType = contentType == null ? "" : contentType.trim().toLowerCase(Locale.ROOT);
      String normalizedFileName = fileName == null ? "" : fileName.trim().toLowerCase(Locale.ROOT);
      if (normalizedContentType.startsWith("image/")) {
        if (normalizedContentType.equals("image/jpeg")
            || normalizedContentType.equals("image/jpg")
            || normalizedContentType.equals("image/png")
            || normalizedContentType.equals("image/webp")) {
          return IMAGE;
        }
      }
      if (normalizedContentType.equals("video/mp4")) {
        return VIDEO;
      }
      if (normalizedFileName.endsWith(".jpg")
          || normalizedFileName.endsWith(".jpeg")
          || normalizedFileName.endsWith(".png")
          || normalizedFileName.endsWith(".webp")) {
        return IMAGE;
      }
      if (normalizedFileName.endsWith(".mp4")) {
        return VIDEO;
      }
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Only jpg, jpeg, png, webp images and mp4 videos are supported");
    }
  }
}
