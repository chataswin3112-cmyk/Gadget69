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
import com.gadget69.catalog.service.RazorpayPaymentService;
import com.gadget69.catalog.service.RazorpayPaymentService.RazorpayOrder;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:order-management;DB_CLOSE_DELAY=-1"
})
@AutoConfigureMockMvc
class OrderManagementControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @MockBean
  private RazorpayPaymentService razorpayPaymentService;

  @Test
  void tracksOrdersByPhoneAndLetsAdminUpdateStatus() throws Exception {
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

    String token = loginAndExtractToken();

    MvcResult createProductResult = mockMvc.perform(post("/api/admin/products")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": "Tracking Test Phone",
                  "description": "Tracking product",
                  "price": 1499.00,
                  "stockQuantity": 10,
                  "sectionId": 1,
                  "imageUrl": "https://example.com/tracking-phone.png",
                  "status": "ACTIVE"
                }
                """))
        .andExpect(status().isOk())
        .andReturn();

    long productId = objectMapper.readTree(createProductResult.getResponse().getContentAsString()).get("id").asLong();

    MvcResult createOrderResult = mockMvc.perform(post("/api/orders")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "customerName": "Riya",
                  "phone": "9876543210",
                  "email": "riya@example.com",
                  "address": "88 Lake Road",
                  "pincode": "560001",
                  "items": [
                    {
                      "productId": %d,
                      "quantity": 1
                    }
                  ]
                }
                """.formatted(productId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("riya@example.com"))
        .andReturn();

    JsonNode order = objectMapper.readTree(createOrderResult.getResponse().getContentAsString());
    long orderId = order.get("id").asLong();
    String razorpayOrderId = order.get("razorpayOrderId").asText();

    mockMvc.perform(post("/api/verify-payment")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "orderId": %d,
                  "razorpayOrderId": "%s",
                  "razorpayPaymentId": "razor-pay-track",
                  "razorpaySignature": "signature"
                }
                """.formatted(orderId, razorpayOrderId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paymentStatus").value("PAID"))
        .andExpect(jsonPath("$.orderStatus").value("CONFIRMED"));

    mockMvc.perform(get("/api/orders/{id}", orderId)
            .param("phone", "+91 98765 43210"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(orderId))
        .andExpect(jsonPath("$.orderStatus").value("CONFIRMED"))
        .andExpect(jsonPath("$.items[0].productName").value("Tracking Test Phone"));

    mockMvc.perform(get("/api/orders/{id}", orderId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(orderId))
        .andExpect(jsonPath("$.customerName").value("Riya"));

    mockMvc.perform(get("/api/orders/{id}", orderId)
            .param("phone", "1111111111"))
        .andExpect(status().isNotFound());

    mockMvc.perform(get("/api/orders")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(orderId));

    mockMvc.perform(put("/api/orders/{id}/status", orderId)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "orderStatus": "SHIPPED"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.orderStatus").value("SHIPPED"));
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
