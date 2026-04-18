package com.gadget69.catalog.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.gadget69.catalog.config.AppProperties;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.CacheControl;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class UploadImageControllerTest {

  @TempDir
  Path tempDir;

  @Test
  void returnsUploadedImageWhenItExists() throws Exception {
    Path imageDirectory = Files.createDirectories(tempDir.resolve("images"));
    Path image = imageDirectory.resolve("hero.png");
    Files.writeString(image, "png");

    MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller()).build();

    mockMvc.perform(get("/uploads/images/hero.png"))
        .andExpect(status().isOk())
        .andExpect(header().string(
            "Cache-Control",
            CacheControl.maxAge(Duration.ofDays(30)).cachePublic().getHeaderValue()))
        .andExpect(content().string("png"));
  }

  @Test
  void fallsBackToPlaceholderWhenImageIsMissing() throws Exception {
    MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller()).build();

    mockMvc.perform(get("/uploads/images/missing.png"))
        .andExpect(status().isOk())
        .andExpect(header().string("Content-Disposition", "inline; filename=\"placeholder.svg\""))
        .andExpect(content().contentType("image/svg+xml"));
  }

  private UploadImageController controller() {
    AppProperties appProperties = new AppProperties();
    appProperties.setUploadDir(tempDir.toString());
    return new UploadImageController(appProperties);
  }
}
