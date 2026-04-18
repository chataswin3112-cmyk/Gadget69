package com.gadget69.catalog.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.gadget69.catalog.service.RazorpayPaymentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:create-order-request-parsing;DB_CLOSE_DELAY=-1"
})
@AutoConfigureMockMvc
class CreateOrderRequestParsingTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private RazorpayPaymentService razorpayPaymentService;

  @Test
  void returnsBadRequestForMalformedJsonBodies() throws Exception {
    mockMvc.perform(post("/api/create-order")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{invalid"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("Invalid JSON request body"));
  }
}
