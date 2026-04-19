package com.gadget69.catalog.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class SpaForwardingControllerTest {

  @Test
  void redirectsLocalSpaRoutesToFrontendDevServerWhenBundleIsMissing() throws Exception {
    MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller()).build();

    mockMvc.perform(get("/products"))
        .andExpect(status().is3xxRedirection())
        .andExpect(redirectedUrl("http://localhost:8080/products"));
  }

  @Test
  void doesNotInterceptBundledAssetRequests() throws Exception {
    MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller()).build();

    mockMvc.perform(get("/assets/react-core-CqQiNtu-.js"))
        .andExpect(status().isNotFound());
  }

  private SpaForwardingController controller() {
    AppProperties appProperties = new AppProperties();
    appProperties.setFrontendDevUrl("http://localhost:8080");
    return new SpaForwardingController(new DefaultResourceLoader(), appProperties);
  }
}
