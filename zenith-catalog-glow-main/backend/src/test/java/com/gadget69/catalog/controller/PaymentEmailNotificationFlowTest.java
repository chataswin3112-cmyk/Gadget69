package com.gadget69.catalog.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gadget69.catalog.entity.CustomerOrder;
import com.gadget69.catalog.service.EmailNotificationService;
import com.gadget69.catalog.service.RazorpayPaymentService;
import com.gadget69.catalog.service.RazorpayPaymentService.RazorpayOrder;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:payment-email-flow;DB_CLOSE_DELAY=-1"
})
@AutoConfigureMockMvc
class PaymentEmailNotificationFlowTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @MockBean
  private RazorpayPaymentService razorpayPaymentService;

  @MockBean
  private EmailNotificationService emailNotificationService;

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
  void verifyPaymentMarksOrderSuccessfulAndSendsConfirmationToUpdatedCustomerEmail() throws Exception {
    long productId = createProduct();

    MvcResult createOrderResult = mockMvc.perform(post("/api/orders")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "customerName": "Riya",
                  "phone": "9876543210",
                  "email": "Customer.UPDATED@Example.com",
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
        .andExpect(jsonPath("$.email").value("customer.updated@example.com"))
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
                  "razorpayPaymentId": "razor-pay-email",
                  "razorpaySignature": "signature"
                }
                """.formatted(orderId, razorpayOrderId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paymentStatus").value("SUCCESS"))
        .andExpect(jsonPath("$.orderStatus").value("CONFIRMED"))
        .andExpect(jsonPath("$.email").value("customer.updated@example.com"))
        .andExpect(jsonPath("$.id").value(orderId));

    ArgumentCaptor<CustomerOrder> orderCaptor = ArgumentCaptor.forClass(CustomerOrder.class);
    verify(emailNotificationService).sendOrderConfirmation(orderCaptor.capture());

    CustomerOrder emailedOrder = orderCaptor.getValue();
    org.junit.jupiter.api.Assertions.assertEquals(orderId, emailedOrder.getId());
    org.junit.jupiter.api.Assertions.assertEquals(
        "customer.updated@example.com",
        emailedOrder.getEmail());
    org.junit.jupiter.api.Assertions.assertEquals("SUCCESS", emailedOrder.getPaymentStatus());
    org.junit.jupiter.api.Assertions.assertEquals("CONFIRMED", emailedOrder.getOrderStatus());
  }

  private long createProduct() throws Exception {
    MvcResult createProductResult = mockMvc.perform(post("/api/admin/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "admin@gadget69.com",
                  "password": "Admin@123"
                }
                """))
        .andExpect(status().isOk())
        .andReturn();

    String token = objectMapper.readTree(createProductResult.getResponse().getContentAsString())
        .get("token")
        .asText();

    MvcResult productResult = mockMvc.perform(post("/api/admin/products")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": "Email Test Phone",
                  "description": "Payment email flow product",
                  "price": 1499.00,
                  "stockQuantity": 10,
                  "sectionId": 1,
                  "imageUrl": "https://example.com/email-test-phone.png",
                  "status": "ACTIVE"
                }
                """))
        .andExpect(status().isOk())
        .andReturn();

    return objectMapper.readTree(productResult.getResponse().getContentAsString()).get("id").asLong();
  }
}
