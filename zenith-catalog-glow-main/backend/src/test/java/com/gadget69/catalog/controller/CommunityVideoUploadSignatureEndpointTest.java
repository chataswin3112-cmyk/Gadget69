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
    "spring.datasource.url=jdbc:h2:mem:community-video-signature;DB_CLOSE_DELAY=-1",
    "app.cloudinary.cloud-name=demo-cloud",
    "app.cloudinary.api-key=demo-key",
    "app.cloudinary.api-secret=demo-secret"
})
@AutoConfigureMockMvc
class CommunityVideoUploadSignatureEndpointTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void uploadSignatureEndpointRequiresAdminAuthentication() throws Exception {
    mockMvc.perform(post("/api/admin/community-media/upload-signature")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fileName": "launch.mp4",
                  "contentType": "video/mp4"
                }
                """))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void uploadSignatureEndpointReturnsSignedVideoUploadParamsForAdmins() throws Exception {
    String token = loginAndExtractToken();

    mockMvc.perform(post("/api/admin/community-media/upload-signature")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fileName": "launch.mp4",
                  "contentType": "video/mp4",
                  "fileSize": 12345
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.cloudName").value("demo-cloud"))
        .andExpect(jsonPath("$.apiKey").value("demo-key"))
        .andExpect(jsonPath("$.folder").value("gadget69/community/videos"))
        .andExpect(jsonPath("$.resourceType").value("video"))
        .andExpect(jsonPath("$.signature").isString())
        .andExpect(jsonPath("$.signature").isNotEmpty())
        .andExpect(jsonPath("$.timestamp").isNumber());
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
