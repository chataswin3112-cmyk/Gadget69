package com.gadget69.catalog.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.stream.StreamSupport;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:review-endpoints;DB_CLOSE_DELAY=-1"
})
@AutoConfigureMockMvc
@Transactional
class ReviewEndpointsTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void publicReviewsReturnSeededEntriesInDescendingDateOrder() throws Exception {
    MvcResult result = mockMvc.perform(get("/api/reviews"))
        .andExpect(status().isOk())
        .andReturn();

    JsonNode reviews = objectMapper.readTree(result.getResponse().getContentAsString());

    Assertions.assertEquals(3, reviews.size());
    Assertions.assertTrue(reviews.get(0).get("date").asText().compareTo(reviews.get(1).get("date").asText()) >= 0);
    Assertions.assertTrue(reviews.get(1).get("date").asText().compareTo(reviews.get(2).get("date").asText()) >= 0);
  }

  @Test
  void adminReviewCrudUpdatesAvatarAndPropagatesToPublicReviews() throws Exception {
    String token = loginAndExtractToken();

    MvcResult createResult = mockMvc.perform(post("/api/admin/reviews")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": "Devika Sen",
                  "rating": 4,
                  "comment": "Solid quality and fast support.",
                  "date": "2026-04-18"
                }
                """))
        .andExpect(status().isOk())
        .andReturn();

    JsonNode createdReview = objectMapper.readTree(createResult.getResponse().getContentAsString());
    long reviewId = createdReview.get("id").asLong();

    mockMvc.perform(put("/api/admin/reviews/{id}", reviewId)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": "Devika Sen",
                  "rating": 5,
                  "comment": "Solid quality and fast support.",
                  "avatar": "https://cdn.example.com/devika.jpg",
                  "date": "2026-04-18"
                }
                """))
        .andExpect(status().isOk());

    MvcResult publicResult = mockMvc.perform(get("/api/reviews"))
        .andExpect(status().isOk())
        .andReturn();

    JsonNode publicReviews = objectMapper.readTree(publicResult.getResponse().getContentAsString());
    JsonNode publicReview = StreamSupport.stream(publicReviews.spliterator(), false)
        .filter(node -> node.get("id").asLong() == reviewId)
        .findFirst()
        .orElseThrow();

    Assertions.assertEquals("https://cdn.example.com/devika.jpg", publicReview.get("avatar").asText());
    Assertions.assertEquals(5, publicReview.get("rating").asInt());

    mockMvc.perform(delete("/api/admin/reviews/{id}", reviewId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isNoContent());

    MvcResult adminListResult = mockMvc.perform(get("/api/admin/reviews")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn();

    JsonNode adminReviews = objectMapper.readTree(adminListResult.getResponse().getContentAsString());
    boolean stillExists = StreamSupport.stream(adminReviews.spliterator(), false)
        .anyMatch(node -> node.get("id").asLong() == reviewId);

    Assertions.assertFalse(stillExists);
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

    JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
    return response.get("token").asText();
  }
}
