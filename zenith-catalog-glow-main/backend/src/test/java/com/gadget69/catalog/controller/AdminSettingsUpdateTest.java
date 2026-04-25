package com.gadget69.catalog.controller;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:admin-settings-update;DB_CLOSE_DELAY=-1"
})
@AutoConfigureMockMvc
@Transactional
class AdminSettingsUpdateTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void updatesSettingsWithSafeRelativeAssetPathsAndTrimmedAnnouncements() throws Exception {
    String token = loginAndExtractToken();

    mockMvc.perform(put("/api/admin/settings")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "siteTitle": "Gadget69 Updated",
                  "metaDescription": " Premium electronics ",
                  "logoUrl": "uploads/images/logo.png",
                  "faviconUrl": "/favicon.svg",
                  "footerText": " Updated footer ",
                  "announcementItems": [" Free shipping ", "", "New arrivals"],
                  "instagramUrl": "https://www.instagram.com/gadget69_tuty/",
                  "whatsappNumber": "919361586278",
                  "shopPhone": "",
                  "supportEmail": "",
                  "catalogueUrl": "/catalogue.pdf",
                  "contactUrl": ""
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.siteTitle").value("Gadget69 Updated"))
        .andExpect(jsonPath("$.logoUrl").value("/uploads/images/logo.png"))
        .andExpect(jsonPath("$.faviconUrl").value("/favicon.svg"))
        .andExpect(jsonPath("$.announcementItems[0]").value("Free shipping"))
        .andExpect(jsonPath("$.announcementItems[1]").value("New arrivals"))
        .andExpect(jsonPath("$.announcementItems[2]").doesNotExist())
        .andExpect(jsonPath("$.catalogueUrl").value("/catalogue.pdf"))
        .andExpect(jsonPath("$.contactUrl").value("/contact"))
        .andExpect(jsonPath("$.shopPhone").value("9361586278"))
        .andExpect(jsonPath("$.supportEmail").value("natrajganesh2000@gmail.com"));
  }

  @Test
  void updatesSettingsWhenLegacyCataloguePlaceholderIsPresent() throws Exception {
    String token = loginAndExtractToken();

    mockMvc.perform(put("/api/admin/settings")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "siteTitle": "Gadget69 Updated",
                  "metaDescription": " Premium electronics ",
                  "logoUrl": "",
                  "faviconUrl": "",
                  "footerText": " Updated footer ",
                  "announcementItems": [" Keep this ", " Added deal ", ""],
                  "instagramUrl": "https://www.instagram.com/gadget69_tuty/",
                  "whatsappNumber": "919361586278",
                  "shopPhone": "9361586278",
                  "supportEmail": "support@gadget69.com",
                  "catalogueUrl": "#",
                  "contactUrl": "/contact"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.announcementItems[0]").value("Keep this"))
        .andExpect(jsonPath("$.announcementItems[1]").value("Added deal"))
        .andExpect(jsonPath("$.announcementItems[2]").doesNotExist())
        .andExpect(jsonPath("$.catalogueUrl").value(nullValue()));
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
