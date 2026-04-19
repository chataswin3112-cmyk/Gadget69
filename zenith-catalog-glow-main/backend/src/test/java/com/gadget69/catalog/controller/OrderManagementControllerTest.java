package com.gadget69.catalog.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
import org.junit.jupiter.api.BeforeEach;
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
  void tracksOrdersByPhoneAndSupportsAdminManagementActions() throws Exception {
    String token = loginAndExtractToken();
    long productId = createProduct(token, "Tracking Test Phone");
    JsonNode order = createOrder(productId, "Riya", "9876543210", "riya@example.com");

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
        .andExpect(jsonPath("$.paymentStatus").value("SUCCESS"))
        .andExpect(jsonPath("$.orderStatus").value("CONFIRMED"));

    mockMvc.perform(get("/api/orders/{id}", orderId)
            .param("phone", "+91 98765 43210"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(orderId))
        .andExpect(jsonPath("$.orderStatus").value("CONFIRMED"))
        .andExpect(jsonPath("$.items[0].productName").value("Tracking Test Phone"));

    mockMvc.perform(get("/api/admin/orders/{id}", orderId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.customerName").value("Riya"));

    mockMvc.perform(get("/api/admin/orders")
            .header("Authorization", "Bearer " + token)
            .param("paymentStatus", "SUCCESS")
            .param("orderStatus", "CONFIRMED"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(orderId));

    mockMvc.perform(put("/api/admin/orders/{id}/status", orderId)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "orderStatus": "SHIPPED"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.orderStatus").value("SHIPPED"));

    mockMvc.perform(put("/api/admin/orders/{id}/cancel", orderId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.orderStatus").value("CANCELLED"));

    mockMvc.perform(put("/api/admin/orders/{id}/archive", orderId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.isDeleted").value(true));

    mockMvc.perform(get("/api/admin/orders/{id}", orderId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isNotFound());
  }

  @Test
  void deleteRulesAllowPendingOrdersAndBlockSuccessfulPayments() throws Exception {
    String token = loginAndExtractToken();
    long productId = createProduct(token, "Delete Rules Phone");

    JsonNode pendingOrder = createOrder(productId, "Asha", "9999999999", "asha@example.com");
    long pendingOrderId = pendingOrder.get("id").asLong();

    mockMvc.perform(delete("/api/admin/orders/{id}", pendingOrderId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isNoContent());

    JsonNode successOrder = createOrder(productId, "Bala", "8888888888", "bala@example.com");
    long successOrderId = successOrder.get("id").asLong();
    String razorpayOrderId = successOrder.get("razorpayOrderId").asText();

    mockMvc.perform(post("/api/verify-payment")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "orderId": %d,
                  "razorpayOrderId": "%s",
                  "razorpayPaymentId": "razor-pay-success",
                  "razorpaySignature": "signature"
                }
                """.formatted(successOrderId, razorpayOrderId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paymentStatus").value("SUCCESS"));

    mockMvc.perform(delete("/api/admin/orders/{id}", successOrderId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isBadRequest());
  }

  private long createProduct(String token, String productName) throws Exception {
    MvcResult createProductResult = mockMvc.perform(post("/api/admin/products")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": "%s",
                  "description": "Tracking product",
                  "price": 1499.00,
                  "stockQuantity": 10,
                  "sectionId": 1,
                  "imageUrl": "https://example.com/tracking-phone.png",
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
