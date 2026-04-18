package com.gadget69.catalog.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import com.gadget69.catalog.config.LocalEnvLoader.LoadResult;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Properties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocalEnvLoaderTest {

  @TempDir
  Path tempDir;

  @Test
  void loadsRootAndBackendEnvFilesWithoutOverridingProcessEnvironment() throws IOException {
    Path projectRoot = tempDir.resolve("project");
    Path backendDir = projectRoot.resolve("backend");
    Files.createDirectories(backendDir);

    Files.writeString(projectRoot.resolve(".env"), """
        APP_RAZORPAY_ENABLED=true
        APP_RAZORPAY_KEY_ID=rzp_live_root
        """);
    Files.writeString(backendDir.resolve(".env"), """
        APP_RAZORPAY_KEY_ID=rzp_live_backend
        APP_RAZORPAY_KEY_SECRET='super-secret'
        """);

    Properties systemProperties = new Properties();
    LoadResult result = LocalEnvLoader.load(
        backendDir,
        systemProperties,
        Map.of("APP_RAZORPAY_ENABLED", "false"));

    assertEquals("false", result.environment().get("APP_RAZORPAY_ENABLED"));
    assertEquals("rzp_live_backend", result.environment().get("APP_RAZORPAY_KEY_ID"));
    assertEquals("super-secret", result.environment().get("APP_RAZORPAY_KEY_SECRET"));
    assertEquals("rzp_live_backend", systemProperties.getProperty("APP_RAZORPAY_KEY_ID"));
    assertEquals("super-secret", systemProperties.getProperty("APP_RAZORPAY_KEY_SECRET"));
    assertFalse(systemProperties.containsKey("APP_RAZORPAY_ENABLED"));
  }
}
