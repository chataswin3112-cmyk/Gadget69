package com.gadget69.catalog.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gadget69.catalog.config.LegacySchemaRepair;
import com.gadget69.catalog.service.RazorpayPaymentService;
import com.gadget69.catalog.service.RazorpayPaymentService.RazorpayOrder;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:order-management-legacy-schema;DB_CLOSE_DELAY=-1"
})
@AutoConfigureMockMvc
class OrderManagementLegacySchemaCompatibilityTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Autowired
  private LegacySchemaRepair legacySchemaRepair;

  @MockBean
  private RazorpayPaymentService razorpayPaymentService;

  @BeforeEach
  void setUpRazorpay() {
    when(razorpayPaymentService.isGatewayReady()).thenReturn(true);
    when(razorpayPaymentService.createOrder(anyLong(), any(BigDecimal.class)))
        .thenAnswer(invocation -> {
          Long orderId = invocation.getArgument(0);
          BigDecimal totalAmount = invocation.getArgument(1);
          int amountPaise = totalAmount.multiply(BigDecimal.valueOf(100)).intValueExact();
          return new RazorpayOrder("order_test_" + orderId, amountPaise, "INR", "rzp_test_key");
        });
    when(razorpayPaymentService.verifyPaymentSignature(
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyString()))
        .thenReturn(true);
  }

  @Test
  void adminOrderEndpointsRecoverAfterLegacyColumnsAreRepaired() throws Exception {
    String token = loginAndExtractToken();
    long productId = createProduct(token, "Legacy Schema Phone");
    JsonNode order = createOrder(productId, "Riya", "9876543210", "riya@example.com");
    long orderId = order.get("id").asLong();

    jdbcTemplate.execute("ALTER TABLE customer_orders DROP COLUMN IF EXISTS email");
    jdbcTemplate.execute("ALTER TABLE order_items DROP COLUMN IF EXISTS variant_id");
    jdbcTemplate.execute("ALTER TABLE order_items DROP COLUMN IF EXISTS variant_color");
    jdbcTemplate.execute("ALTER TABLE order_items DROP COLUMN IF EXISTS variant_size");

    legacySchemaRepair.afterPropertiesSet();

    mockMvc.perform(get("/api/admin/orders")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(orderId))
        .andExpect(jsonPath("$[0].items[0].productName").value("Legacy Schema Phone"));

    mockMvc.perform(get("/api/admin/orders/{id}", orderId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(orderId))
        .andExpect(jsonPath("$.items[0].productName").value("Legacy Schema Phone"));

    mockMvc.perform(put("/api/admin/orders/{id}/status", orderId)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "orderStatus": "PROCESSING"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.orderStatus").value("PROCESSING"));
  }

  private long createProduct(String token, String productName) throws Exception {
    MvcResult createProductResult = mockMvc.perform(post("/api/admin/products")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": "%s",
                  "description": "Legacy schema compatibility product",
                  "price": 1499.00,
                  "stockQuantity": 10,
                  "sectionId": 1,
                  "imageUrl": "https://example.com/legacy-schema-phone.png",
                  "status": "ACTIVE"
                }
                """.formatted(productName)))
        .andExpect(status().isOk())
        .andReturn();

    return objectMapper.readTree(createProductResult.getResponse().getContentAsString()).get("id").asLong();
  }

  private JsonNode createOrder(long productId, String customerName, String phone, String email) throws Exception {
    MvcResult createOrderResult = mockMvc.perform(post("/api/orders")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "customerName": "%s",
                  "phone": "%s",
                  "email": "%s",
                  "address": "88 Lake Road",
                  "pincode": "560001",
                  "items": [
                    {
                      "productId": %d,
                      "quantity": 1
                    }
                  ]
                }
                """.formatted(customerName, phone, email, productId)))
        .andExpect(status().isOk())
        .andReturn();

    return objectMapper.readTree(createOrderResult.getResponse().getContentAsString());
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
