package com.gadget69.catalog.mapper;

import com.gadget69.catalog.dto.ApiDtos;
import com.gadget69.catalog.entity.Banner;
import com.gadget69.catalog.entity.CommunityMedia;
import com.gadget69.catalog.entity.CustomerOrder;
import com.gadget69.catalog.entity.OrderItem;
import com.gadget69.catalog.entity.Product;
import com.gadget69.catalog.entity.ProductMedia;
import com.gadget69.catalog.entity.ProductVariant;
import com.gadget69.catalog.entity.Review;
import com.gadget69.catalog.entity.Section;
import com.gadget69.catalog.entity.StoreSettings;
import com.gadget69.catalog.entity.VariantMedia;
import java.util.ArrayList;
import com.gadget69.catalog.service.OrderStateSupport;
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
        section.getSortOrder(),
        section.getParentSection() == null ? null : section.getParentSection().getId(),
        section.getParentSection() == null ? null : section.getParentSection().getName()
    );
  }

  public ApiDtos.ProductResponse toProductResponse(Product product) {
    List<ApiDtos.VariantResponse> variants = product.getVariants() == null
        ? List.of()
        : product.getVariants().stream().map(this::toVariantResponse).toList();
    List<ApiDtos.ProductMediaResponse> media = resolveProductMedia(product);
    String primaryImageUrl = media.stream()
        .filter(item -> "IMAGE".equalsIgnoreCase(item.mediaType()))
        .filter(item -> Boolean.TRUE.equals(item.isPrimary()))
        .map(ApiDtos.ProductMediaResponse::mediaUrl)
        .findFirst()
        .orElseGet(() -> media.stream()
            .filter(item -> "IMAGE".equalsIgnoreCase(item.mediaType()))
            .map(ApiDtos.ProductMediaResponse::mediaUrl)
            .findFirst()
            .orElse(toPublicMediaUrl(product.getImageUrl())));
    String primaryVideoUrl = media.stream()
        .filter(item -> "VIDEO".equalsIgnoreCase(item.mediaType()))
        .map(ApiDtos.ProductMediaResponse::mediaUrl)
        .findFirst()
        .orElse(toPublicMediaUrl(product.getVideoUrl()));
    List<String> galleryImages = media.stream()
        .filter(item -> "IMAGE".equalsIgnoreCase(item.mediaType()))
        .map(ApiDtos.ProductMediaResponse::mediaUrl)
        .filter(url -> url != null && !url.equals(primaryImageUrl))
        .toList();

    return new ApiDtos.ProductResponse(
        product.getId(),
        product.getName(),
        product.getDescription(),
        product.getPrice(),
        product.getShippingCharge() == null ? java.math.BigDecimal.ZERO : product.getShippingCharge(),
        product.getStockQuantity(),
        product.getSection().getId(),
        product.getSection().getName(),
        product.getSection().getParentSection() == null ? null : product.getSection().getParentSection().getId(),
        product.getSection().getParentSection() == null ? null : product.getSection().getParentSection().getName(),
        primaryImageUrl,
        primaryVideoUrl,
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
        toPublicMediaUrl(product.getDefaultThumbnailUrl() == null ? primaryImageUrl : product.getDefaultThumbnailUrl()),
        galleryImages,
        product.getSpecifications(),
        variants,
        media
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
        settings.getWhatsappNumber(),
        settings.getShopPhone(),
        settings.getSupportEmail(),
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
    List<ApiDtos.OrderItemPayload> items = (order.getItems() == null ? List.<OrderItem>of() : order.getItems()).stream()
        .map(this::toOrderItemPayload)
        .toList();

    return new ApiDtos.OrderResponse(
        order.getId(),
        order.getCustomerName(),
        order.getPhone(),
        order.getEmail(),
        order.getAddress(),
        order.getPincode(),
        order.getSpecialInstructions(),
        order.getTotalAmount(),
        OrderStateSupport.normalizePaymentStatus(order.getPaymentStatus()),
        OrderStateSupport.normalizeOrderStatus(order.getOrderStatus()),
        order.getRazorpayOrderId(),
        order.getRazorpayPaymentId(),
        order.getCreatedAt() == null ? null : order.getCreatedAt().toString(),
        order.getUpdatedAt() == null ? null : order.getUpdatedAt().toString(),
        items,
        order.getCurrency(),
        order.getAmountPaise(),
        null,
        order.isDeleted()
    );
  }

  public ApiDtos.OrderItemPayload toOrderItemPayload(OrderItem orderItem) {
    return new ApiDtos.OrderItemPayload(
        orderItem.getProductId(),
        orderItem.getProductName(),
        orderItem.getVariantId(),
        orderItem.getVariantColor(),
        orderItem.getVariantSize(),
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

  public ApiDtos.VariantResponse toVariantResponse(ProductVariant variant) {
    List<ApiDtos.VariantMediaResponse> media = variant.getMedia() == null
        ? List.of()
        : variant.getMedia().stream().map(this::toVariantMediaResponse).toList();

    return new ApiDtos.VariantResponse(
        variant.getId(),
        variant.getProduct() != null ? variant.getProduct().getId() : null,
        variant.getColorName(),
        variant.getHexCode(),
        variant.getSize(),
        variant.getPrice(),
        variant.getPriceAdjustment(),
        variant.getStock(),
        variant.getSku(),
        variant.getIsDefault(),
        variant.getDisplayOrder(),
        media
    );
  }

  public ApiDtos.VariantMediaResponse toVariantMediaResponse(VariantMedia media) {
    return new ApiDtos.VariantMediaResponse(
        media.getId(),
        toPublicMediaUrl(media.getMediaUrl()),
        media.getMediaType(),
        media.getMediaRole(),
        media.getDisplayOrder(),
        media.getIsPrimary()
    );
  }

  public ApiDtos.ProductMediaResponse toProductMediaResponse(ProductMedia media) {
    return new ApiDtos.ProductMediaResponse(
        media.getId(),
        toPublicMediaUrl(media.getMediaUrl()),
        media.getMediaType(),
        media.getMediaRole(),
        media.getDisplayOrder(),
        media.getIsPrimary()
    );
  }

  private List<ApiDtos.ProductMediaResponse> resolveProductMedia(Product product) {
    if (product.getMedia() != null && !product.getMedia().isEmpty()) {
      return product.getMedia().stream().map(this::toProductMediaResponse).toList();
    }

    List<ApiDtos.ProductMediaResponse> legacyMedia = new ArrayList<>();
    int displayOrder = 0;

    if (product.getImageUrl() != null && !product.getImageUrl().isBlank()) {
      legacyMedia.add(new ApiDtos.ProductMediaResponse(
          null,
          toPublicMediaUrl(product.getImageUrl()),
          "IMAGE",
          "MAIN",
          displayOrder++,
          true));
    }

    if (product.getVideoUrl() != null && !product.getVideoUrl().isBlank()) {
      legacyMedia.add(new ApiDtos.ProductMediaResponse(
          null,
          toPublicMediaUrl(product.getVideoUrl()),
          "VIDEO",
          "ADDITIONAL",
          displayOrder++,
          false));
    }

    if (product.getGalleryImages() != null) {
      for (String imageUrl : product.getGalleryImages()) {
        if (imageUrl == null || imageUrl.isBlank()) {
          continue;
        }
        legacyMedia.add(new ApiDtos.ProductMediaResponse(
            null,
            toPublicMediaUrl(imageUrl),
            "IMAGE",
            "ADDITIONAL",
            displayOrder++,
            false));
      }
    }

    return legacyMedia;
  }
}
