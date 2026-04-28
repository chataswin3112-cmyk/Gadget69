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
    long maxBytes = switch (mediaKind) {
      case IMAGE -> 10L * 1024 * 1024;
      case VIDEO -> 50L * 1024 * 1024;
      case RAW -> 25L * 1024 * 1024;
    };
    if (fileSize > maxBytes) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          switch (mediaKind) {
            case IMAGE -> "Image must be 10 MB or smaller";
            case VIDEO -> "Video must be 50 MB or smaller";
            case RAW -> "File must be 25 MB or smaller";
          });
    }
  }

  private String resolveFolder(AppProperties.Cloudinary config, UploadTarget target, MediaKind mediaKind) {
    return switch (target) {
      case PRODUCT -> {
        requireImageOrVideo(mediaKind, "Product uploads only support images or videos");
        yield sanitizeFolder(mediaKind == MediaKind.VIDEO
            ? config.getProductVideoFolder()
            : config.getProductImageFolder());
      }
      case VARIANT -> {
        requireImageOrVideo(mediaKind, "Variant uploads only support images or videos");
        yield sanitizeFolder(mediaKind == MediaKind.VIDEO
            ? config.getVariantVideoFolder()
            : config.getVariantImageFolder());
      }
      case CATEGORY -> {
        requireImage(mediaKind, "Category uploads only support images");
        yield sanitizeFolder(config.getCategoryImageFolder());
      }
      case BANNER -> {
        requireImage(mediaKind, "Banner uploads only support images");
        yield sanitizeFolder(config.getBannerImageFolder());
      }
      case COMMUNITY -> {
        requireImage(mediaKind, "Community image uploads only support images");
        yield sanitizeFolder(config.getCommunityImageFolder());
      }
      case REVIEW -> {
        requireImage(mediaKind, "Review uploads only support images");
        yield sanitizeFolder(config.getReviewImageFolder());
      }
      case SETTINGS -> {
        if (mediaKind == MediaKind.VIDEO) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Settings uploads only support images or PDF files");
        }
        yield sanitizeFolder(mediaKind == MediaKind.RAW
            ? config.getSettingsFileFolder()
            : config.getSettingsImageFolder());
      }
      case GENERAL -> sanitizeFolder(config.getAdminAssetFolder());
    };
  }

  private void requireImage(MediaKind mediaKind, String message) {
    if (mediaKind != MediaKind.IMAGE) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
  }

  private void requireImageOrVideo(MediaKind mediaKind, String message) {
    if (mediaKind != MediaKind.IMAGE && mediaKind != MediaKind.VIDEO) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
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
    CATEGORY,
    BANNER,
    COMMUNITY,
    REVIEW,
    SETTINGS,
    GENERAL;

    private static UploadTarget from(String value) {
      if (value == null || value.isBlank()) {
        return PRODUCT;
      }
      try {
        return UploadTarget.valueOf(value.trim().toUpperCase(Locale.ROOT));
      } catch (IllegalArgumentException ex) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Upload target must be PRODUCT, VARIANT, CATEGORY, BANNER, COMMUNITY, REVIEW, SETTINGS, or GENERAL");
      }
    }
  }

  private enum MediaKind {
    IMAGE("image"),
    VIDEO("video"),
    RAW("raw");

    private final String resourceType;

    MediaKind(String resourceType) {
      this.resourceType = resourceType;
    }

    private static MediaKind from(String contentType, String fileName) {
      String normalizedContentType = contentType == null ? "" : contentType.trim().toLowerCase(Locale.ROOT);
      String normalizedFileName = fileName == null ? "" : fileName.trim().toLowerCase(Locale.ROOT);
      if (isSupportedImageContentType(normalizedContentType)
          || hasExtension(normalizedFileName, ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg")) {
        return IMAGE;
      }
      if (isSupportedVideoContentType(normalizedContentType)
          || hasExtension(normalizedFileName, ".mp4", ".mov", ".webm")) {
        return VIDEO;
      }
      if ("application/pdf".equals(normalizedContentType) || normalizedFileName.endsWith(".pdf")) {
        return RAW;
      }
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Only jpg, jpeg, png, webp, gif, svg images, mp4, mov, webm videos, and PDF files are supported");
    }

    private static boolean isSupportedImageContentType(String contentType) {
      return contentType.equals("image/jpeg")
          || contentType.equals("image/jpg")
          || contentType.equals("image/png")
          || contentType.equals("image/webp")
          || contentType.equals("image/gif")
          || contentType.equals("image/svg+xml");
    }

    private static boolean isSupportedVideoContentType(String contentType) {
      return contentType.equals("video/mp4")
          || contentType.equals("video/quicktime")
          || contentType.equals("video/webm");
    }

    private static boolean hasExtension(String fileName, String... extensions) {
      for (String extension : extensions) {
        if (fileName.endsWith(extension)) {
          return true;
        }
      }
      return false;
    }
  }
}
