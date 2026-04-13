package com.gadget69.catalog.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.gadget69.catalog.entity.Product;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class ProductPricingServiceTest {

  private final ProductPricingService productPricingService = new ProductPricingService();

  @Test
  void offerIsActiveAcrossInclusiveDateRange() {
    Product product = buildProduct(true, "2026-04-10", "2026-04-15");

    assertThat(productPricingService.isOfferActive(product, LocalDate.parse("2026-04-10"))).isTrue();
    assertThat(productPricingService.isOfferActive(product, LocalDate.parse("2026-04-12"))).isTrue();
    assertThat(productPricingService.isOfferActive(product, LocalDate.parse("2026-04-15"))).isTrue();
    assertThat(productPricingService.resolveEffectivePrice(product, LocalDate.parse("2026-04-12")))
        .isEqualByComparingTo("799.99");
  }

  @Test
  void offerIsInactiveBeforeAfterOrWithoutFullSchedule() {
    Product scheduled = buildProduct(true, "2026-04-10", "2026-04-15");
    Product missingDates = buildProduct(true, null, null);
    Product disabled = buildProduct(false, "2026-04-10", "2026-04-15");

    assertThat(productPricingService.isOfferActive(scheduled, LocalDate.parse("2026-04-09"))).isFalse();
    assertThat(productPricingService.isOfferActive(scheduled, LocalDate.parse("2026-04-16"))).isFalse();
    assertThat(productPricingService.isOfferActive(missingDates, LocalDate.parse("2026-04-12"))).isFalse();
    assertThat(productPricingService.isOfferActive(disabled, LocalDate.parse("2026-04-12"))).isFalse();
    assertThat(productPricingService.resolveEffectivePrice(scheduled, LocalDate.parse("2026-04-16")))
        .isEqualByComparingTo("999.99");
  }

  private Product buildProduct(boolean offerEnabled, String startDate, String endDate) {
    Product product = new Product();
    product.setPrice(new BigDecimal("999.99"));
    product.setOffer(offerEnabled);
    product.setOfferPrice(new BigDecimal("799.99"));
    product.setOfferStartDate(startDate == null ? null : LocalDate.parse(startDate));
    product.setOfferEndDate(endDate == null ? null : LocalDate.parse(endDate));
    return product;
  }
}
