package com.gadget69.catalog.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:catalog-media-signature;DB_CLOSE_DELAY=-1",
    "app.cloudinary.cloud-name=demo-cloud",
    "app.cloudinary.api-key=demo-key",
    "app.cloudinary.api-secret=demo-secret"
})
@AutoConfigureMockMvc
class CatalogMediaUploadSignatureEndpointTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void imageUploadSignatureUsesProductImageFolder() throws Exception {
    String token = loginAndExtractToken();

    mockMvc.perform(post("/api/admin/catalog-media/upload-signature")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fileName": "hero.webp",
                  "contentType": "image/webp",
                  "fileSize": 2048,
                  "target": "PRODUCT"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.cloudName").value("demo-cloud"))
        .andExpect(jsonPath("$.apiKey").value("demo-key"))
        .andExpect(jsonPath("$.folder").value("gadget69/products/images"))
        .andExpect(jsonPath("$.resourceType").value("image"))
        .andExpect(jsonPath("$.signature").isString())
        .andExpect(jsonPath("$.timestamp").isNumber());
  }

  @Test
  void imageUploadSignatureUsesCategoryImageFolder() throws Exception {
    String token = loginAndExtractToken();

    mockMvc.perform(post("/api/admin/catalog-media/upload-signature")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fileName": "subcategory.png",
                  "contentType": "image/png",
                  "fileSize": 4096,
                  "target": "CATEGORY"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.cloudName").value("demo-cloud"))
        .andExpect(jsonPath("$.apiKey").value("demo-key"))
        .andExpect(jsonPath("$.folder").value("gadget69/categories/images"))
        .andExpect(jsonPath("$.resourceType").value("image"))
        .andExpect(jsonPath("$.signature").isString())
        .andExpect(jsonPath("$.timestamp").isNumber());
  }

  @Test
  void imageUploadSignatureUsesBannerImageFolder() throws Exception {
    String token = loginAndExtractToken();

    mockMvc.perform(post("/api/admin/catalog-media/upload-signature")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fileName": "homepage-banner.jpg",
                  "contentType": "image/jpeg",
                  "fileSize": 4096,
                  "target": "BANNER"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.cloudName").value("demo-cloud"))
        .andExpect(jsonPath("$.apiKey").value("demo-key"))
        .andExpect(jsonPath("$.folder").value("gadget69/banners/images"))
        .andExpect(jsonPath("$.resourceType").value("image"))
        .andExpect(jsonPath("$.signature").isString())
        .andExpect(jsonPath("$.timestamp").isNumber());
  }

  @Test
  void videoUploadSignatureAcceptsMovFilesForProductMedia() throws Exception {
    String token = loginAndExtractToken();

    mockMvc.perform(post("/api/admin/catalog-media/upload-signature")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fileName": "clip.mov",
                  "contentType": "video/quicktime",
                  "fileSize": 2048,
                  "target": "PRODUCT"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.folder").value("gadget69/products/videos"))
        .andExpect(jsonPath("$.resourceType").value("video"));
  }

  @Test
  void settingsUploadSignatureAcceptsPdfFilesAsRawAssets() throws Exception {
    String token = loginAndExtractToken();

    mockMvc.perform(post("/api/admin/catalog-media/upload-signature")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fileName": "catalogue.pdf",
                  "contentType": "application/pdf",
                  "fileSize": 2048,
                  "target": "SETTINGS"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.folder").value("gadget69/settings/files"))
        .andExpect(jsonPath("$.resourceType").value("raw"));
  }

  @Test
  void rejectsUnsupportedCatalogMediaTypes() throws Exception {
    String token = loginAndExtractToken();

    mockMvc.perform(post("/api/admin/catalog-media/upload-signature")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fileName": "script.exe",
                  "contentType": "application/octet-stream",
                  "fileSize": 2048,
                  "target": "VARIANT"
                }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("Only jpg, jpeg, png, webp, gif, svg images, mp4, mov, webm videos, and PDF files are supported"));
  }

  private String loginAndExtractToken() throws Exception {
    MvcResult result = mockMvc.perform(post("/api/admin/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "admin@gadget69.com",
                  "password": "Admin@123"
                }
                """))
        .andExpect(status().isOk())
        .andReturn();

    String response = result.getResponse().getContentAsString();
    int start = response.indexOf("\"token\":\"");
    int end = response.indexOf('"', start + 9);
    return response.substring(start + 9, end);
  }
}
