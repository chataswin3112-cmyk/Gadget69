package com.gadget69.catalog.controller;

import com.gadget69.catalog.config.AppProperties;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class UploadImageController {

  private static final CacheControl FOUND_IMAGE_CACHE =
      CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable();
  private static final CacheControl FALLBACK_IMAGE_CACHE =
      CacheControl.maxAge(Duration.ofHours(1)).cachePublic();
  private static final MediaType IMAGE_WEBP = MediaType.valueOf("image/webp");

  private final Path uploadImagesDirectory;

  public UploadImageController(AppProperties appProperties) {
    this.uploadImagesDirectory = Path.of(appProperties.getUploadDir())
        .toAbsolutePath()
        .normalize()
        .resolve("images");
  }

  @GetMapping("/uploads/images/{filename:.+}")
  public ResponseEntity<Resource> image(
      @PathVariable String filename,
      @RequestHeader(value = HttpHeaders.ACCEPT, required = false) String acceptHeader) {
    Path requestedImage = uploadImagesDirectory.resolve(filename).normalize();
    if (!requestedImage.startsWith(uploadImagesDirectory)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found");
    }

    Path bestImage = selectBestImagePath(requestedImage, acceptHeader);
    if (bestImage != null) {
      FileSystemResource image = new FileSystemResource(bestImage);
      return ResponseEntity.ok()
          .cacheControl(FOUND_IMAGE_CACHE)
          .header(HttpHeaders.VARY, HttpHeaders.ACCEPT)
          .contentType(resolveMediaType(image))
          .body(image);
    }

    ClassPathResource placeholder = new ClassPathResource("static/placeholder.svg");
    return ResponseEntity.ok()
        .cacheControl(FALLBACK_IMAGE_CACHE)
        .header(HttpHeaders.VARY, HttpHeaders.ACCEPT)
        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"placeholder.svg\"")
        .contentType(resolveMediaType(placeholder))
        .body(placeholder);
  }

  private Path selectBestImagePath(Path requestedImage, String acceptHeader) {
    if (acceptsWebp(acceptHeader)) {
      Path webpVariant = resolveWebpVariant(requestedImage);
      if (webpVariant != null && Files.isRegularFile(webpVariant) && Files.isReadable(webpVariant)) {
        return webpVariant;
      }
    }

    if (Files.isRegularFile(requestedImage) && Files.isReadable(requestedImage)) {
      return requestedImage;
    }

    return null;
  }

  private boolean acceptsWebp(String acceptHeader) {
    return acceptHeader != null && acceptHeader.toLowerCase(java.util.Locale.ROOT).contains("image/webp");
  }

  private Path resolveWebpVariant(Path requestedImage) {
    String requestedFileName = requestedImage.getFileName().toString();
    if (requestedFileName.toLowerCase(java.util.Locale.ROOT).endsWith(".webp")) {
      return requestedImage;
    }

    int extensionIndex = requestedFileName.lastIndexOf('.');
    String webpFileName = extensionIndex > 0
        ? requestedFileName.substring(0, extensionIndex) + ".webp"
        : requestedFileName + ".webp";
    Path webpPath = requestedImage.resolveSibling(webpFileName).normalize();
    return webpPath.startsWith(uploadImagesDirectory) ? webpPath : null;
  }

  private MediaType resolveMediaType(Resource resource) {
    String filename = resource.getFilename();
    if (filename != null && filename.toLowerCase(java.util.Locale.ROOT).endsWith(".webp")) {
      return IMAGE_WEBP;
    }

    return MediaTypeFactory.getMediaType(resource).orElse(MediaType.APPLICATION_OCTET_STREAM);
  }
}
