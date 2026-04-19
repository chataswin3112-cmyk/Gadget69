package com.gadget69.catalog.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

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
    "spring.datasource.url=jdbc:h2:mem:dashboard-order-pricing;DB_CLOSE_DELAY=-1"
})
@AutoConfigureMockMvc
class AdminDashboardAndOrderPricingTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @MockBean
  private RazorpayPaymentService razorpayPaymentService;

  @Test
  void dashboardUsesPaidOrdersAndCreateOrderRecalculatesEffectivePrice() throws Exception {
    when(razorpayPaymentService.isGatewayReady()).thenReturn(true);
    when(razorpayPaymentService.createOrder(anyLong(), any(BigDecimal.class)))
        .thenAnswer(invocation -> {
          Long localOrderId = invocation.getArgument(0);
          BigDecimal totalAmount = invocation.getArgument(1);
          int amountPaise = totalAmount.multiply(BigDecimal.valueOf(100)).intValueExact();
          return new RazorpayOrder("order_test_" + localOrderId, amountPaise, "INR", "rzp_test_key");
        });
    when(razorpayPaymentService.verifyPaymentSignature(
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyString()))
        .thenReturn(true);
    when(razorpayPaymentService.verifyWebhookSignature(
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyString()))
        .thenReturn(true);
    when(razorpayPaymentService.parseWebhook(org.mockito.ArgumentMatchers.anyString()))
        .thenAnswer(invocation -> objectMapper.readTree(invocation.getArgument(0, String.class)));

    String token = loginAndExtractToken();

    String today = java.time.LocalDate.now().toString();
    String tomorrow = java.time.LocalDate.now().plusDays(1).toString();

    MvcResult createProductResult = mockMvc.perform(post("/api/admin/products")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": "Scheduled Offer Phone",
                  "description": "Offer-enabled product",
                  "price": 999.99,
                  "stockQuantity": 25,
                  "sectionId": 1,
                  "imageUrl": "https://example.com/offer-phone.png",
                  "offer": true,
                  "offerPrice": 799.99,
                  "offerStartDate": "%s",
                  "offerEndDate": "%s",
                  "status": "ACTIVE"
                }
                """.formatted(today, tomorrow)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.offerStartDate").value(today))
        .andExpect(jsonPath("$.offerEndDate").value(tomorrow))
        .andReturn();

    JsonNode createdProduct = objectMapper.readTree(createProductResult.getResponse().getContentAsString());
    long productId = createdProduct.get("id").asLong();

    MvcResult createOrderResult = mockMvc.perform(post("/api/create-order")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "customerName": "Asha",
                  "phone": "9876543210",
                  "email": "asha@example.com",
                  "address": "42 Market Street",
                  "pincode": "600001",
                  "totalAmount": 2.00,
                  "paymentStatus": "PENDING",
                  "items": [
                    {
                      "productId": %d,
                      "productName": "Tampered Name",
                      "quantity": 2,
                      "price": 1.00
                    }
                  ]
                }
                """.formatted(productId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].productName").value("Scheduled Offer Phone"))
        .andExpect(jsonPath("$.items[0].price").value(799.99))
        .andExpect(jsonPath("$.totalAmount").value(1599.98))
        .andReturn();

    JsonNode createdOrder = objectMapper.readTree(createOrderResult.getResponse().getContentAsString());
    long orderId = createdOrder.get("id").asLong();
    String razorpayOrderId = createdOrder.get("razorpayOrderId").asText();

    mockMvc.perform(post("/api/verify-payment")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "orderId": %d,
                  "razorpayOrderId": "%s",
                  "razorpayPaymentId": "razor-pay-1",
                  "razorpaySignature": "signature"
                }
                """.formatted(orderId, razorpayOrderId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paymentStatus").value("SUCCESS"))
        .andExpect(jsonPath("$.orderStatus").value("CONFIRMED"));

    mockMvc.perform(post("/api/razorpay/webhook")
            .header("X-Razorpay-Signature", "valid-signature")
            .header("X-Razorpay-Event-Id", "evt_capture_1")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "event": "payment.captured",
                  "payload": {
                    "payment": {
                      "entity": {
                        "id": "razor-pay-1",
                        "order_id": "%s",
                        "status": "captured"
                      }
                    }
                  }
                }
                """.formatted(razorpayOrderId)))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/admin/dashboard")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalOrders").value(1))
        .andExpect(jsonPath("$.paidOrders").value(1))
        .andExpect(jsonPath("$.totalRevenue").value(1599.98))
        .andExpect(jsonPath("$.conversionRate").value(100.0))
        .andExpect(jsonPath("$.topSellingProducts[0].productId").value(productId))
        .andExpect(jsonPath("$.topSellingProducts[0].productName").value("Scheduled Offer Phone"))
        .andExpect(jsonPath("$.topSellingProducts[0].unitsSold").value(2))
        .andExpect(jsonPath("$.topSellingProducts[0].revenue").value(1599.98));
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
