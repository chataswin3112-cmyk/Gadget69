package com.gadget69.catalog.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
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
import com.gadget69.catalog.repository.CustomerOrderRepository;
import com.gadget69.catalog.service.RazorpayPaymentService;
import com.gadget69.catalog.service.RazorpayPaymentService.RazorpayOrder;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:create-order-payment-gateway-behavior;DB_CLOSE_DELAY=-1"
})
@AutoConfigureMockMvc
class CreateOrderPaymentGatewayBehaviorTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private CustomerOrderRepository customerOrderRepository;

  @MockBean
  private RazorpayPaymentService razorpayPaymentService;

  @Test
  void returnsSavedOrderWithoutRazorpayFieldsWhenGatewayIsNotReady() throws Exception {
    when(razorpayPaymentService.isGatewayReady()).thenReturn(false);

    long initialOrderCount = customerOrderRepository.count();
    long productId = createProduct();
    MvcResult createOrderResult = mockMvc.perform(post("/api/orders")
            .contentType(MediaType.APPLICATION_JSON)
            .content(validOrderRequest(productId, "Gateway Offline", "9876543210", "offline@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paymentStatus").value("PENDING"))
        .andExpect(jsonPath("$.orderStatus").value("PENDING"))
        .andReturn();

    JsonNode order = objectMapper.readTree(createOrderResult.getResponse().getContentAsString());
    assertFalse(order.hasNonNull("razorpayOrderId"));
    assertFalse(order.hasNonNull("razorpayKeyId"));

    List<CustomerOrder> savedOrders = customerOrderRepository.findAll();
    assertEquals(initialOrderCount + 1, savedOrders.size());
    CustomerOrder savedOrder = savedOrders.get(savedOrders.size() - 1);
    assertEquals("PENDING", savedOrder.getPaymentStatus());
  }

  @Test
  void preservesGatewayStatusAndMarksOrderFailedWhenRazorpayOrderCreationFails() throws Exception {
    when(razorpayPaymentService.isGatewayReady()).thenReturn(true);
    when(razorpayPaymentService.createOrder(anyLong(), any(BigDecimal.class)))
        .thenThrow(new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to create Razorpay order"));

    long initialOrderCount = customerOrderRepository.count();
    long productId = createProduct();

    mockMvc.perform(post("/api/orders")
            .contentType(MediaType.APPLICATION_JSON)
            .content(validOrderRequest(productId, "Gateway Failure", "9999999999", "failed@example.com")))
        .andExpect(status().isBadGateway())
        .andExpect(jsonPath("$.message").value("Unable to create Razorpay order"));

    List<CustomerOrder> savedOrders = customerOrderRepository.findAll();
    assertEquals(initialOrderCount + 1, savedOrders.size());
    CustomerOrder savedOrder = savedOrders.get(savedOrders.size() - 1);
    assertEquals("FAILED", savedOrder.getPaymentStatus());
    assertEquals("PENDING", savedOrder.getOrderStatus());
    assertNull(savedOrder.getRazorpayOrderId());
  }

  @Test
  void persistsSpecialInstructionsWhenProvidedAtCheckout() throws Exception {
    when(razorpayPaymentService.isGatewayReady()).thenReturn(false);

    long productId = createProduct();
    MvcResult createOrderResult = mockMvc.perform(post("/api/orders")
            .contentType(MediaType.APPLICATION_JSON)
            .content(validOrderRequest(
                productId,
                "Needs Note",
                "9000000000",
                "note@example.com",
                "Please send the blue color if available")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.specialInstructions").value("Please send the blue color if available"))
        .andReturn();

    JsonNode response = objectMapper.readTree(createOrderResult.getResponse().getContentAsString());
    Long orderId = response.get("id").asLong();
    CustomerOrder savedOrder = customerOrderRepository.findById(orderId).orElseThrow();
    assertEquals("Please send the blue color if available", savedOrder.getSpecialInstructions());
  }

  @Test
  void addsProductShippingChargePerQuantityToOrderAndGatewayAmount() throws Exception {
    when(razorpayPaymentService.isGatewayReady()).thenReturn(true);
    when(razorpayPaymentService.createOrder(anyLong(), any(BigDecimal.class)))
        .thenAnswer(invocation -> {
          Long localOrderId = invocation.getArgument(0);
          BigDecimal totalAmount = invocation.getArgument(1);
          return new RazorpayOrder(
              "order_shipping_" + localOrderId,
              totalAmount.multiply(BigDecimal.valueOf(100)).intValueExact(),
              "INR",
              "rzp_test_shipping");
        });

    long productId = createProduct(new BigDecimal("50.00"));
    MvcResult createOrderResult = mockMvc.perform(post("/api/orders")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "customerName": "Shipping Test",
                  "phone": "9111111111",
                  "email": "shipping@example.com",
                  "address": "88 Lake Road",
                  "pincode": "560001",
                  "items": [
                    {
                      "productId": %d,
                      "quantity": 2
                    }
                  ]
                }
                """.formatted(productId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalAmount").value(3098.00))
        .andExpect(jsonPath("$.amountPaise").value(309800))
        .andReturn();

    JsonNode response = objectMapper.readTree(createOrderResult.getResponse().getContentAsString());
    assertEquals("rzp_test_shipping", response.get("razorpayKeyId").asText());

    ArgumentCaptor<BigDecimal> totalCaptor = ArgumentCaptor.forClass(BigDecimal.class);
    verify(razorpayPaymentService).createOrder(anyLong(), totalCaptor.capture());
    assertEquals(0, totalCaptor.getValue().compareTo(new BigDecimal("3098.00")));
  }

  @Test
  void creatingProductWithoutShippingChargeReturnsZeroShippingCharge() throws Exception {
    JsonNode product = createProductResponse(null);
    assertEquals(0, product.get("shippingCharge").decimalValue().compareTo(BigDecimal.ZERO));
  }

  private long createProduct() throws Exception {
    return createProduct(null);
  }

  private long createProduct(BigDecimal shippingCharge) throws Exception {
    return createProductResponse(shippingCharge).get("id").asLong();
  }

  private JsonNode createProductResponse(BigDecimal shippingCharge) throws Exception {
    MvcResult loginResult = mockMvc.perform(post("/api/admin/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "admin@gadget69.com",
                  "password": "Admin@123"
                }
                """))
        .andExpect(status().isOk())
        .andReturn();

    String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
        .get("token")
        .asText();
    long sectionId = createSubcategory(token);

    MvcResult productResult = mockMvc.perform(post("/api/admin/products")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": "Gateway Test Phone",
                  "description": "Gateway behavior product",
                  "price": 1499.00,
                  %s
                  "stockQuantity": 10,
                  "sectionId": %d,
                  "imageUrl": "https://example.com/gateway-test-phone.png",
                  "status": "ACTIVE"
                }
                """.formatted(
                shippingCharge == null ? "" : "\"shippingCharge\": " + shippingCharge + ",",
                sectionId)))
        .andExpect(status().isOk())
        .andReturn();

    return objectMapper.readTree(productResult.getResponse().getContentAsString());
  }

  private long createSubcategory(String token) throws Exception {
    long parentId = createSection(token, "Gateway Category", null);
    return createSection(token, "Gateway Subcategory", parentId);
  }

  private long createSection(String token, String name, Long parentSectionId) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/admin/sections")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": "%s",
                  "description": "Test category",
                  "imageUrl": "/placeholder.svg",
                  "parentSectionId": %s
                }
                """.formatted(name, parentSectionId == null ? "null" : parentSectionId.toString())))
        .andExpect(status().isOk())
        .andReturn();
    return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
  }

  private String validOrderRequest(long productId, String customerName, String phone, String email) {
    return validOrderRequest(productId, customerName, phone, email, null);
  }

  private String validOrderRequest(
      long productId,
      String customerName,
      String phone,
      String email,
      String specialInstructions) {
    return """
        {
          "customerName": "%s",
          "phone": "%s",
          "email": "%s",
          "address": "88 Lake Road",
          "pincode": "560001",
          "specialInstructions": %s,
          "items": [
            {
              "productId": %d,
              "quantity": 1
            }
          ]
        }
        """.formatted(
        customerName,
        phone,
        email,
        specialInstructions == null ? "null" : "\"" + specialInstructions + "\"",
        productId);
  }
}
