package com.gadget69.catalog.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

public final class LocalEnvLoader {

  private LocalEnvLoader() {
  }

  public static LoadResult load(Properties systemProperties, Map<String, String> environment) {
    return load(Paths.get("").toAbsolutePath().normalize(), systemProperties, environment);
  }

  static LoadResult load(Path workingDirectory, Properties systemProperties, Map<String, String> environment) {
    Map<String, String> fileValues = new LinkedHashMap<>();
    List<Path> candidates = candidateFiles(workingDirectory);

    for (Path candidate : candidates) {
      fileValues.putAll(readFile(candidate));
    }

    fileValues.forEach((key, value) -> {
      if (!hasText(environment.get(key)) && !hasText(systemProperties.getProperty(key))) {
        systemProperties.setProperty(key, value);
      }
    });

    Map<String, String> merged = new LinkedHashMap<>(fileValues);
    environment.forEach((key, value) -> {
      if (hasText(value)) {
        merged.put(key, value);
      }
    });

    List<Path> loadedFiles = candidates.stream()
        .filter(Files::isRegularFile)
        .toList();
    return new LoadResult(merged, loadedFiles);
  }

  static List<Path> candidateFiles(Path workingDirectory) {
    Set<Path> files = new LinkedHashSet<>();
    Path normalized = workingDirectory.toAbsolutePath().normalize();
    Path parent = normalized.getParent();

    if (parent != null) {
      addEnvFiles(files, parent);
    }
    addEnvFiles(files, normalized);
    addEnvFiles(files, normalized.resolve("backend"));

    return files.stream().toList();
  }

  private static void addEnvFiles(Set<Path> files, Path directory) {
    files.add(directory.resolve(".env").normalize());
    files.add(directory.resolve(".env.local").normalize());
  }

  private static Map<String, String> readFile(Path file) {
    Map<String, String> values = new LinkedHashMap<>();
    if (!Files.isRegularFile(file)) {
      return values;
    }

    try {
      for (String rawLine : Files.readAllLines(file)) {
        String line = rawLine.trim();
        if (line.isEmpty() || line.startsWith("#")) {
          continue;
        }
        if (line.startsWith("export ")) {
          line = line.substring("export ".length()).trim();
        }

        int separator = line.indexOf('=');
        if (separator <= 0) {
          continue;
        }

        String key = line.substring(0, separator).trim();
        if (!hasText(key)) {
          continue;
        }

        String value = normalizeValue(line.substring(separator + 1));
        values.put(key, value);
      }
      return values;
    } catch (IOException ex) {
      throw new IllegalStateException("Unable to read env file: " + file, ex);
    }
  }

  private static String normalizeValue(String rawValue) {
    String value = rawValue.trim();
    if (value.length() >= 2) {
      char first = value.charAt(0);
      char last = value.charAt(value.length() - 1);
      if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
        return value.substring(1, value.length() - 1);
      }
    }
    return value;
  }

  private static boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  public record LoadResult(Map<String, String> environment, List<Path> loadedFiles) {
  }
}
