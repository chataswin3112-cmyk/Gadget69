package com.gadget69.catalog.controller;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.empty;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:category-hierarchy;DB_CLOSE_DELAY=-1"
})
@AutoConfigureMockMvc
@Transactional
class AdminCategoryHierarchyTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Test
  void createsSubcategoryAndReturnsParentFields() throws Exception {
    String token = loginAndExtractToken();
    long parentId = createSection(token, "Accessories", null);
    long childId = createSection(token, "Chargers", parentId);

    mockMvc.perform(get("/api/admin/sections")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.id == %s)].parentSectionId".formatted(childId)).value(contains((int) parentId)))
        .andExpect(jsonPath("$[?(@.id == %s)].parentSectionName".formatted(childId)).value(contains("Accessories")));
  }

  @Test
  void rejectsThirdLevelCategoryAndDeletingParentWithChildren() throws Exception {
    String token = loginAndExtractToken();
    long parentId = createSection(token, "Devices", null);
    long childId = createSection(token, "Android Phones", parentId);

    mockMvc.perform(post("/api/admin/sections")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(sectionPayload("Budget Phones", childId)))
        .andExpect(status().isBadRequest());

    mockMvc.perform(delete("/api/admin/sections/{id}", parentId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isBadRequest());
  }

  @Test
  void allowsNewProductsOnMainCategoriesAndReturnsParentFieldsForSubcategoryProducts() throws Exception {
    String token = loginAndExtractToken();
    long parentId = createSection(token, "Audio", null);
    long childId = createSection(token, "Earbuds", parentId);

    mockMvc.perform(post("/api/admin/products")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(productPayload("Parent Level Product", parentId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.sectionId").value(parentId))
        .andExpect(jsonPath("$.sectionName").value("Audio"))
        .andExpect(jsonPath("$.parentSectionId").value(org.hamcrest.Matchers.nullValue()))
        .andExpect(jsonPath("$.parentSectionName").value(org.hamcrest.Matchers.nullValue()));

    mockMvc.perform(post("/api/admin/products")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(productPayload("ANC Earbuds", childId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.sectionId").value(childId))
        .andExpect(jsonPath("$.sectionName").value("Earbuds"))
        .andExpect(jsonPath("$.parentSectionId").value(parentId))
        .andExpect(jsonPath("$.parentSectionName").value("Audio"));
  }

  @Test
  void deletesProductsWithRelatedMediaAndVariants() throws Exception {
    String token = loginAndExtractToken();
    long categoryId = createSection(token, "Cleanup Audio", null);
    long productId = createProduct(token, "Cleanup Earbuds", categoryId, 0, "ACTIVE");

    jdbcTemplate.update("""
        INSERT INTO product_variants (
          product_id, color_name, hex_code, price_adjustment, stock, is_default, display_order, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, productId, "Blue", "#0000FF", 0, 5, true, 0);
    Long variantId = jdbcTemplate.queryForObject(
        "SELECT id FROM product_variants WHERE product_id = ? AND color_name = ?",
        Long.class,
        productId,
        "Blue");

    jdbcTemplate.update("""
        INSERT INTO product_media (product_id, media_url, media_type, media_role, display_order, is_primary)
        VALUES (?, ?, ?, ?, ?, ?)
        """, productId, "https://example.com/product-media.png", "IMAGE", "MAIN", 0, true);
    jdbcTemplate.update("""
        INSERT INTO variant_media (variant_id, media_url, media_type, media_role, display_order, is_primary)
        VALUES (?, ?, ?, ?, ?, ?)
        """, variantId, "https://example.com/variant-media.png", "IMAGE", "MAIN", 0, true);

    mockMvc.perform(delete("/api/admin/products/{id}", productId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isNoContent());

    Integer productCount = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM products WHERE id = ?",
        Integer.class,
        productId);
    Integer variantCount = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM product_variants WHERE product_id = ?",
        Integer.class,
        productId);
    Integer productMediaCount = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM product_media WHERE product_id = ?",
        Integer.class,
        productId);
    Integer variantMediaCount = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM variant_media WHERE variant_id = ?",
        Integer.class,
        variantId);

    org.assertj.core.api.Assertions.assertThat(productCount).isZero();
    org.assertj.core.api.Assertions.assertThat(variantCount).isZero();
    org.assertj.core.api.Assertions.assertThat(productMediaCount).isZero();
    org.assertj.core.api.Assertions.assertThat(variantMediaCount).isZero();
  }

  @Test
  void publicCatalogShowsOnlyActiveSubcategoryProductsInDisplayOrder() throws Exception {
    String token = loginAndExtractToken();
    long parentId = createSection(token, "Cables", null);
    long childId = createSection(token, "USB-C Cables", parentId);

    createProduct(token, "Second Cable", childId, 20, "ACTIVE");
    long draftProductId = createProduct(token, "Draft Cable", childId, 1, "DRAFT");
    createProduct(token, "First Cable", childId, 10, "ACTIVE");

    mockMvc.perform(get("/api/products"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.sectionId == %s)].name".formatted(childId))
            .value(contains("First Cable", "Second Cable")))
        .andExpect(jsonPath("$[?(@.sectionId == %s)].parentSectionId".formatted(childId))
            .value(contains((int) parentId, (int) parentId)))
        .andExpect(jsonPath("$[?(@.sectionId == %s)].parentSectionName".formatted(childId))
            .value(contains("Cables", "Cables")))
        .andExpect(jsonPath("$[?(@.name == 'Draft Cable')]").value(empty()));

    mockMvc.perform(get("/api/products/{id}", draftProductId))
        .andExpect(status().isNotFound());
  }

  private long createSection(String token, String name, Long parentSectionId) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/admin/sections")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(sectionPayload(name, parentSectionId)))
        .andExpect(status().isOk())
        .andReturn();

    return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
  }

  private long createProduct(
      String token,
      String name,
      long sectionId,
      int displayOrder,
      String productStatus) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/admin/products")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(productPayload(name, sectionId, displayOrder, productStatus)))
        .andExpect(status().isOk())
        .andReturn();

    return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
  }

  private String sectionPayload(String name, Long parentSectionId) {
    return """
        {
          "name": %s,
          "description": "Test category",
          "imageUrl": "/placeholder.svg",
          "is_active": true,
          "show_in_explore": true,
          "show_in_top_category": false,
          "sort_order": 0,
          "parentSectionId": %s
        }
        """.formatted(quoteText(name), parentSectionId == null ? "null" : parentSectionId.toString());
  }

  private String productPayload(String name, long sectionId) {
    return productPayload(name, sectionId, 0, "ACTIVE");
  }

  private String productPayload(String name, long sectionId, int displayOrder, String status) {
    return """
        {
          "name": %s,
          "description": "Hierarchy product",
          "price": 1999,
          "stockQuantity": 5,
          "sectionId": %s,
          "imageUrl": "/placeholder.svg",
          "offer": false,
          "display_order": %s,
          "status": %s,
          "galleryImages": []
        }
        """.formatted(quoteText(name), sectionId, displayOrder, quoteText(status));
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

  private String quoteText(String value) {
    return objectMapper.valueToTree(value).toString();
  }
}
