package com.gadget69.catalog.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:community-media-portrait;DB_CLOSE_DELAY=-1"
})
@AutoConfigureMockMvc
class CommunityMediaPortraitVideoTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void createCommunityMediaAcceptsPortraitVideoMetadata() throws Exception {
    String token = loginAndExtractToken();

    mockMvc.perform(post("/api/admin/community-media")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Portrait reel",
                  "caption": "Vertical creator clip",
                  "mediaType": "VIDEO",
                  "videoUrl": "https://www.instagram.com/reel/C8xYzAbCdEf/",
                  "thumbnailUrl": "https://example.com/portrait-thumb.jpg",
                  "videoWidth": 1080,
                  "videoHeight": 1920,
                  "videoDuration": 14.2,
                  "displayOrder": 4,
                  "isActive": true
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mediaType").value("VIDEO"))
        .andExpect(jsonPath("$.videoUrl").value("https://www.instagram.com/reel/C8xYzAbCdEf/"))
        .andExpect(jsonPath("$.thumbnailUrl").value("https://example.com/portrait-thumb.jpg"))
        .andExpect(jsonPath("$.videoWidth").value(1080))
        .andExpect(jsonPath("$.videoHeight").value(1920));
  }

  private String loginAndExtractToken() throws Exception {
    MvcResult result = mockMvc.perform(post("/api/admin/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "admin@gadget69.com",
                  "password": "admin123"
                }
                """))
        .andExpect(status().isOk())
        .andReturn();

    JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
    return response.get("token").asText();
  }
}
