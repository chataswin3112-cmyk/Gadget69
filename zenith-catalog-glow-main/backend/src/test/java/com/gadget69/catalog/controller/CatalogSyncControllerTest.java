package com.gadget69.catalog.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
    "spring.datasource.url=jdbc:h2:mem:catalog-sync;DB_CLOSE_DELAY=-1"
})
@AutoConfigureMockMvc
class CatalogSyncControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void replaceDemoDataKeepsLiveCatalogIdempotent() throws Exception {
    String token = loginAndExtractToken();

    mockMvc.perform(post("/api/admin/catalog/replace-demo-data")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalSections").value(10))
        .andExpect(jsonPath("$.totalProducts").value(20))
        .andExpect(jsonPath("$.heroBanners").value(3));

    mockMvc.perform(post("/api/admin/catalog/replace-demo-data")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalSections").value(10))
        .andExpect(jsonPath("$.totalProducts").value(20))
        .andExpect(jsonPath("$.heroBanners").value(3));

    mockMvc.perform(get("/api/products"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(20)))
        .andExpect(jsonPath("$[0].name").value("Ultra Series 9 Smartwatch (AMOLED Display)"))
        .andExpect(jsonPath("$[0].price").value(2499.00))
        .andExpect(jsonPath("$[0].sectionName").value("Wearables"));

    mockMvc.perform(get("/api/community-media"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(0)));
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
