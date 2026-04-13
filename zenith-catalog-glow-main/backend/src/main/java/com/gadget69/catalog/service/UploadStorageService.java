package com.gadget69.catalog.service;

import com.gadget69.catalog.config.AppProperties;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UploadStorageService {

  private final AppProperties appProperties;

  @PostConstruct
  void init() {
    try {
      Files.createDirectories(rootPath());
      Files.createDirectories(rootPath().resolve("images"));
      Files.createDirectories(rootPath().resolve("videos"));
      Files.createDirectories(rootPath().resolve("documents"));
    } catch (IOException ex) {
      throw new IllegalStateException("Unable to initialize upload storage", ex);
    }
  }

  public StoredFile store(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a file to upload");
    }

    String mediaBucket = detectBucket(file.getContentType());
    String extension = resolveExtension(file.getOriginalFilename());
    String fileName = UUID.randomUUID() + (extension.isBlank() ? "" : "." + extension);
    Path target = rootPath().resolve(mediaBucket).resolve(fileName).normalize();

    if (!target.startsWith(rootPath())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid upload path");
    }

    try {
      Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
      return new StoredFile("/uploads/" + mediaBucket + "/" + fileName, fileName, mediaBucket.toUpperCase(Locale.ROOT));
    } catch (IOException ex) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store uploaded file");
    }
  }

  private Path rootPath() {
    return Path.of(appProperties.getUploadDir()).toAbsolutePath().normalize();
  }

  private String resolveExtension(String originalName) {
    String cleanName = StringUtils.cleanPath(originalName == null ? "" : originalName);
    int dotIndex = cleanName.lastIndexOf('.');
    if (dotIndex < 0 || dotIndex == cleanName.length() - 1) {
      return "";
    }
    return cleanName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
  }

  private String detectBucket(String contentType) {
    if (contentType == null) {
      return "documents";
    }
    if (contentType.startsWith("image/")) {
      return "images";
    }
    if (contentType.startsWith("video/")) {
      return "videos";
    }
    return "documents";
  }

  public record StoredFile(String path, String fileName, String mediaType) {}
}
