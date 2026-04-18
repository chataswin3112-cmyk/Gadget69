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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class UploadImageController {

  private static final CacheControl FOUND_IMAGE_CACHE =
      CacheControl.maxAge(Duration.ofDays(30)).cachePublic();
  private static final CacheControl FALLBACK_IMAGE_CACHE =
      CacheControl.maxAge(Duration.ofHours(1)).cachePublic();

  private final Path uploadImagesDirectory;

  public UploadImageController(AppProperties appProperties) {
    this.uploadImagesDirectory = Path.of(appProperties.getUploadDir())
        .toAbsolutePath()
        .normalize()
        .resolve("images");
  }

  @GetMapping("/uploads/images/{filename:.+}")
  public ResponseEntity<Resource> image(@PathVariable String filename) {
    Path requestedImage = uploadImagesDirectory.resolve(filename).normalize();
    if (!requestedImage.startsWith(uploadImagesDirectory)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found");
    }

    if (Files.isRegularFile(requestedImage) && Files.isReadable(requestedImage)) {
      FileSystemResource image = new FileSystemResource(requestedImage);
      return ResponseEntity.ok()
          .cacheControl(FOUND_IMAGE_CACHE)
          .contentType(resolveMediaType(image))
          .body(image);
    }

    ClassPathResource placeholder = new ClassPathResource("static/placeholder.svg");
    return ResponseEntity.ok()
        .cacheControl(FALLBACK_IMAGE_CACHE)
        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"placeholder.svg\"")
        .contentType(resolveMediaType(placeholder))
        .body(placeholder);
  }

  private MediaType resolveMediaType(Resource resource) {
    return MediaTypeFactory.getMediaType(resource).orElse(MediaType.APPLICATION_OCTET_STREAM);
  }
}
