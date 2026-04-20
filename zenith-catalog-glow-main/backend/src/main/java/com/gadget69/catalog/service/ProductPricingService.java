package com.gadget69.catalog.service;

import com.gadget69.catalog.entity.Product;
import com.gadget69.catalog.entity.ProductVariant;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.stereotype.Service;

@Service
public class ProductPricingService {

  public boolean isOfferActive(Product product, LocalDate currentDate) {
    if (product == null || currentDate == null) {
      return false;
    }

    if (!Boolean.TRUE.equals(product.getOffer()) || product.getOfferPrice() == null) {
      return false;
    }

    if (product.getOfferStartDate() == null || product.getOfferEndDate() == null) {
      return false;
    }

    if (product.getOfferEndDate().isBefore(product.getOfferStartDate())) {
      return false;
    }

    return !currentDate.isBefore(product.getOfferStartDate())
        && !currentDate.isAfter(product.getOfferEndDate());
  }

  public BigDecimal resolveEffectivePrice(Product product, LocalDate currentDate) {
    if (isOfferActive(product, currentDate)) {
      return product.getOfferPrice();
    }
    return product.getPrice();
  }

  public BigDecimal resolveEffectivePrice(Product product, ProductVariant variant, LocalDate currentDate) {
    BigDecimal basePrice = resolveEffectivePrice(product, currentDate);
    if (variant == null) {
      return basePrice;
    }
    if (variant.getPrice() != null) {
      return variant.getPrice();
    }
    if (basePrice == null) {
      return null;
    }
    return basePrice.add(BigDecimal.valueOf(variant.getPriceAdjustment() == null ? 0 : variant.getPriceAdjustment()));
  }
}
