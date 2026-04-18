package com.gadget69.catalog.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    "spring.datasource.url=jdbc:h2:mem:offer-update;DB_CLOSE_DELAY=-1"
})
@AutoConfigureMockMvc
@Transactional
class AdminOfferUpdateTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void updatingProductOfferReturnsHydratedProductResponse() throws Exception {
    String token = loginAndExtractToken();

    MvcResult productsResult = mockMvc.perform(get("/api/admin/products")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn();

    JsonNode products = objectMapper.readTree(productsResult.getResponse().getContentAsString());
    JsonNode product = products.get(0);
    long productId = product.get("id").asLong();

    mockMvc.perform(put("/api/admin/products/{id}", productId)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": %s,
                  "description": %s,
                  "price": %s,
                  "stockQuantity": %s,
                  "sectionId": %s,
                  "imageUrl": %s,
                  "videoUrl": %s,
                  "offer": true,
                  "offerPrice": 88888,
                  "offerStartDate": "2026-04-11",
                  "offerEndDate": "2026-04-20",
                  "slug": %s,
                  "model_number": %s,
                  "short_description": %s,
                  "mrp": %s,
                  "display_order": %s,
                  "is_new_launch": %s,
                  "is_best_seller": %s,
                  "is_featured": %s,
                  "is_hero_featured": %s,
                  "status": %s,
                  "default_thumbnail_url": %s,
                  "galleryImages": %s
                }
                """.formatted(
                quote(product.get("name")),
                quote(product.get("description")),
                product.get("price"),
                product.get("stockQuantity"),
                product.get("sectionId"),
                quote(product.get("imageUrl")),
                nullableJson(product.get("videoUrl")),
                nullableJson(product.get("slug")),
                nullableJson(product.get("model_number")),
                nullableJson(product.get("short_description")),
                nullableJson(product.get("mrp")),
                nullableJson(product.get("display_order")),
                nullableJson(product.get("is_new_launch")),
                nullableJson(product.get("is_best_seller")),
                nullableJson(product.get("is_featured")),
                nullableJson(product.get("is_hero_featured")),
                quote(product.get("status")),
                nullableJson(product.get("default_thumbnail_url")),
                product.get("galleryImages").toString()
            )))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(productId))
        .andExpect(jsonPath("$.sectionName").value(product.get("sectionName").asText()))
        .andExpect(jsonPath("$.offer").value(true))
        .andExpect(jsonPath("$.offerPrice").value(88888))
        .andExpect(jsonPath("$.offerStartDate").value("2026-04-11"))
        .andExpect(jsonPath("$.offerEndDate").value("2026-04-20"));
  }

  @Test
  void seededCatalogProductsStartWithoutFakeOffersAndAllowVideoUrlUpdates() throws Exception {
    String token = loginAndExtractToken();

    MvcResult productsResult = mockMvc.perform(get("/api/admin/products")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn();

    JsonNode products = objectMapper.readTree(productsResult.getResponse().getContentAsString());
    JsonNode product = products.get(0);
    long productId = product.get("id").asLong();
    String today = java.time.LocalDate.now().toString();
    String tomorrow = java.time.LocalDate.now().plusDays(1).toString();

    Assertions.assertFalse(product.get("offer").asBoolean(), "Seeded catalog products should not fake offers");
    Assertions.assertTrue(product.get("offerStartDate").isNull(), "Seeded catalog products should not fake offer dates");
    Assertions.assertTrue(product.get("offerEndDate").isNull(), "Seeded catalog products should not fake offer dates");

    mockMvc.perform(put("/api/admin/products/{id}", productId)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": %s,
                  "description": %s,
                  "price": %s,
                  "stockQuantity": %s,
                  "sectionId": %s,
                  "imageUrl": %s,
                  "videoUrl": "https://www.youtube.com/watch?v=abc123XYZ78",
                  "offer": true,
                  "offerPrice": 88888,
                  "offerStartDate": %s,
                  "offerEndDate": %s,
                  "slug": %s,
                  "model_number": %s,
                  "short_description": %s,
                  "mrp": %s,
                  "display_order": %s,
                  "is_new_launch": %s,
                  "is_best_seller": %s,
                  "is_featured": %s,
                  "is_hero_featured": %s,
                  "status": %s,
                  "default_thumbnail_url": %s,
                  "galleryImages": %s
                }
                """.formatted(
                quote(product.get("name")),
                quote(product.get("description")),
                product.get("price"),
                product.get("stockQuantity"),
                product.get("sectionId"),
                quote(product.get("imageUrl")),
                quoteText(today),
                quoteText(tomorrow),
                nullableJson(product.get("slug")),
                nullableJson(product.get("model_number")),
                nullableJson(product.get("short_description")),
                nullableJson(product.get("mrp")),
                nullableJson(product.get("display_order")),
                nullableJson(product.get("is_new_launch")),
                nullableJson(product.get("is_best_seller")),
                nullableJson(product.get("is_featured")),
                nullableJson(product.get("is_hero_featured")),
                quote(product.get("status")),
                nullableJson(product.get("default_thumbnail_url")),
                product.get("galleryImages").toString()
            )))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.videoUrl").value("https://www.youtube.com/watch?v=abc123XYZ78"))
        .andExpect(jsonPath("$.offerStartDate").value(today))
        .andExpect(jsonPath("$.offerEndDate").value(tomorrow));
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

  private String quote(JsonNode node) {
    return objectMapper.valueToTree(node == null || node.isNull() ? null : node.asText()).toString();
  }

  private String nullableJson(JsonNode node) {
    return node == null || node.isNull() ? "null" : node.toString();
  }

  private String quoteText(String value) {
    return objectMapper.valueToTree(value).toString();
  }
}
