package com.gadget69.catalog.mapper;

import com.gadget69.catalog.dto.ApiDtos;
import com.gadget69.catalog.entity.Banner;
import com.gadget69.catalog.entity.CommunityMedia;
import com.gadget69.catalog.entity.CustomerOrder;
import com.gadget69.catalog.entity.OrderItem;
import com.gadget69.catalog.entity.Product;
import com.gadget69.catalog.entity.Review;
import com.gadget69.catalog.entity.Section;
import com.gadget69.catalog.entity.StoreSettings;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class CatalogMapper {

  public ApiDtos.SectionResponse toSectionResponse(Section section) {
    return new ApiDtos.SectionResponse(
        section.getId(),
        section.getName(),
        section.getDescription(),
        toPublicMediaUrl(section.getImageUrl()),
        section.getIsActive(),
        section.getShowInExplore(),
        section.getShowInTopCategory(),
        section.getAccentTone(),
        section.getSortOrder()
    );
  }

  public ApiDtos.ProductResponse toProductResponse(Product product) {
    return new ApiDtos.ProductResponse(
        product.getId(),
        product.getName(),
        product.getDescription(),
        product.getPrice(),
        product.getStockQuantity(),
        product.getSection().getId(),
        product.getSection().getName(),
        toPublicMediaUrl(product.getImageUrl()),
        toPublicMediaUrl(product.getVideoUrl()),
        product.getCreatedAt() == null ? null : product.getCreatedAt().toString(),
        product.getOffer(),
        product.getOfferPrice(),
        product.getOfferStartDate(),
        product.getOfferEndDate(),
        product.getSlug(),
        product.getModelNumber(),
        product.getShortDescription(),
        product.getMrp(),
        product.getDisplayOrder(),
        product.getIsNewLaunch(),
        product.getIsBestSeller(),
        product.getIsFeatured(),
        product.getIsHeroFeatured(),
        product.getStatus(),
        toPublicMediaUrl(product.getDefaultThumbnailUrl()),
        product.getGalleryImages() == null
            ? List.of()
            : product.getGalleryImages().stream().map(this::toPublicMediaUrl).toList(),
        product.getSpecifications()
    );
  }

  public ApiDtos.BannerResponse toBannerResponse(Banner banner) {
    return new ApiDtos.BannerResponse(
        banner.getId(),
        banner.getTitle(),
        toPublicMediaUrl(banner.getDesktopImageUrl()),
        toPublicMediaUrl(banner.getMobileImageUrl()),
        banner.getCtaText(),
        banner.getCtaLink(),
        banner.getLinkedProductId(),
        banner.getDisplayOrder(),
        banner.getIsActive()
    );
  }

  public ApiDtos.SettingsResponse toSettingsResponse(StoreSettings settings) {
    return new ApiDtos.SettingsResponse(
        settings.getId(),
        settings.getSiteTitle(),
        settings.getMetaDescription(),
        toPublicMediaUrl(settings.getLogoUrl()),
        toPublicMediaUrl(settings.getFaviconUrl()),
        settings.getFooterText(),
        settings.getAnnouncementItems(),
        settings.getInstagramUrl(),
        settings.getFacebookUrl(),
        settings.getWhatsappNumber(),
        toPublicMediaUrl(settings.getCatalogueUrl()),
        settings.getContactUrl()
    );
  }

  public ApiDtos.CommunityMediaResponse toCommunityMediaResponse(CommunityMedia media) {
    return new ApiDtos.CommunityMediaResponse(
        media.getId(),
        media.getTitle(),
        media.getCaption(),
        media.getMediaType(),
        toPublicMediaUrl(media.getImageUrl()),
        toPublicMediaUrl(media.getVideoUrl()),
        toPublicMediaUrl(media.getThumbnailUrl()),
        media.getVideoPublicId(),
        media.getVideoWidth(),
        media.getVideoHeight(),
        media.getVideoDuration(),
        media.getActionLink(),
        media.getDisplayOrder(),
        media.getIsActive()
    );
  }

  public ApiDtos.ReviewResponse toReviewResponse(Review review) {
    return new ApiDtos.ReviewResponse(
        review.getId(),
        review.getName(),
        review.getRating(),
        review.getComment(),
        toPublicMediaUrl(review.getAvatar()),
        review.getReviewDate()
    );
  }

  public ApiDtos.OrderResponse toOrderResponse(CustomerOrder order) {
    List<ApiDtos.OrderItemPayload> items = order.getItems().stream()
        .map(this::toOrderItemPayload)
        .toList();

    return new ApiDtos.OrderResponse(
        order.getId(),
        order.getCustomerName(),
        order.getPhone(),
        order.getAddress(),
        order.getPincode(),
        order.getTotalAmount(),
        order.getPaymentStatus(),
        order.getRazorpayOrderId(),
        order.getRazorpayPaymentId(),
        order.getCreatedAt() == null ? null : order.getCreatedAt().toString(),
        items,
        order.getCurrency(),
        order.getAmountPaise(),
        null
    );
  }

  public ApiDtos.OrderItemPayload toOrderItemPayload(OrderItem orderItem) {
    return new ApiDtos.OrderItemPayload(
        orderItem.getProductId(),
        orderItem.getProductName(),
        orderItem.getQuantity(),
        orderItem.getPrice()
    );
  }

  public String toPublicMediaUrl(String url) {
    if (url == null || url.isBlank()) {
      return url;
    }
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/uploads/")) {
      return url;
    }
    return url;
  }
}
