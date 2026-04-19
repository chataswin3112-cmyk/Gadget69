package com.gadget69.catalog.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class ApiDtos {

  private ApiDtos() {
  }

  public record AdminLoginRequest(String email, String password) {}

  public record AdminLoginResponse(String token, String message) {}

  public record OtpDispatchResponse(String message, String recipient) {}

  public record ChangePasswordRequest(String currentPassword, String newPassword) {}
  public record OtpPasswordChangeRequest(String otp, String newPassword) {}
  public record ResetPasswordWithKeyRequest(String secretKey, String newPassword) {}

  public record UploadResponse(String url, String fileName, String mediaType) {}

  public record CommunityVideoUploadSignatureRequest(
      String fileName,
      String contentType,
      Long fileSize
  ) {}

  public record CommunityVideoUploadSignatureResponse(
      String cloudName,
      String apiKey,
      Long timestamp,
      String signature,
      String folder,
      String resourceType
  ) {}

  public record DashboardStatsResponse(
      long totalOrders,
      long paidOrders,
      BigDecimal totalRevenue,
      BigDecimal conversionRate,
      long totalProducts,
      long totalSections,
      long totalBanners,
      long totalCommunityMedia,
      List<TopSellingProductResponse> topSellingProducts
  ) {}

  public record TopSellingProductResponse(
      Long productId,
      String productName,
      Integer unitsSold,
      BigDecimal revenue
  ) {}

  public record SectionPayload(
      String name,
      String description,
      String imageUrl,
      Boolean is_active,
      Boolean show_in_explore,
      Boolean show_in_top_category,
      String accent_tone,
      Integer sort_order
  ) {}

  public record SectionResponse(
      Long id,
      String name,
      String description,
      String imageUrl,
      Boolean is_active,
      Boolean show_in_explore,
      Boolean show_in_top_category,
      String accent_tone,
      Integer sort_order
  ) {}

  public record ProductPayload(
      String name,
      String description,
      BigDecimal price,
      Integer stockQuantity,
      Long sectionId,
      String imageUrl,
      String videoUrl,
      Boolean offer,
      BigDecimal offerPrice,
      LocalDate offerStartDate,
      LocalDate offerEndDate,
      String slug,
      String model_number,
      String short_description,
      BigDecimal mrp,
      Integer display_order,
      Boolean is_new_launch,
      Boolean is_best_seller,
      Boolean is_featured,
      Boolean is_hero_featured,
      String status,
      String default_thumbnail_url,
      List<String> galleryImages,
      Map<String, String> specifications
  ) {}

  public record ProductResponse(
      Long id,
      String name,
      String description,
      BigDecimal price,
      Integer stockQuantity,
      Long sectionId,
      String sectionName,
      String imageUrl,
      String videoUrl,
      String createdAt,
      Boolean offer,
      BigDecimal offerPrice,
      LocalDate offerStartDate,
      LocalDate offerEndDate,
      String slug,
      String model_number,
      String short_description,
      BigDecimal mrp,
      Integer display_order,
      Boolean is_new_launch,
      Boolean is_best_seller,
      Boolean is_featured,
      Boolean is_hero_featured,
      String status,
      String default_thumbnail_url,
      List<String> galleryImages,
      Map<String, String> specifications,
      List<VariantResponse> variants
  ) {}

  public record BannerPayload(
      String title,
      String desktopImageUrl,
      String mobileImageUrl,
      String ctaText,
      String ctaLink,
      Long linkedProductId,
      Integer displayOrder,
      Boolean isActive
  ) {}

  public record BannerResponse(
      Long id,
      String title,
      String desktopImageUrl,
      String mobileImageUrl,
      String ctaText,
      String ctaLink,
      Long linkedProductId,
      Integer displayOrder,
      Boolean isActive
  ) {}

  public record SettingsPayload(
      String siteTitle,
      String metaDescription,
      String logoUrl,
      String faviconUrl,
      String footerText,
      List<String> announcementItems,
      String instagramUrl,
      String facebookUrl,
      String whatsappNumber,
      String catalogueUrl,
      String contactUrl
  ) {}

  public record SettingsResponse(
      Long id,
      String siteTitle,
      String metaDescription,
      String logoUrl,
      String faviconUrl,
      String footerText,
      List<String> announcementItems,
      String instagramUrl,
      String facebookUrl,
      String whatsappNumber,
      String catalogueUrl,
      String contactUrl
  ) {}

  public record CommunityMediaPayload(
      String title,
      String caption,
      String mediaType,
      String imageUrl,
      String videoUrl,
      String thumbnailUrl,
      String videoPublicId,
      Integer videoWidth,
      Integer videoHeight,
      Double videoDuration,
      String actionLink,
      Integer displayOrder,
      Boolean isActive
  ) {}

  public record CommunityMediaResponse(
      Long id,
      String title,
      String caption,
      String mediaType,
      String imageUrl,
      String videoUrl,
      String thumbnailUrl,
      String videoPublicId,
      Integer videoWidth,
      Integer videoHeight,
      Double videoDuration,
      String actionLink,
      Integer displayOrder,
      Boolean isActive
  ) {}

  public record ReviewPayload(
      String name,
      Integer rating,
      String comment,
      String avatar,
      LocalDate date
  ) {}

  public record ReviewResponse(
      Long id,
      String name,
      Integer rating,
      String comment,
      String avatar,
      LocalDate date
  ) {}

  public record OrderItemPayload(
      Long productId,
      String productName,
      Integer quantity,
      BigDecimal price
  ) {}

  public record CreateOrderRequest(
      String customerName,
      String phone,
      String address,
      String pincode,
      BigDecimal totalAmount,
      String paymentStatus,
      List<OrderItemPayload> items
  ) {}

  public record PaymentVerifyRequest(
      Long orderId,
      String razorpayOrderId,
      String razorpayPaymentId,
      String razorpaySignature
  ) {}

  public record OrderResponse(
      Long id,
      String customerName,
      String phone,
      String address,
      String pincode,
      BigDecimal totalAmount,
      String paymentStatus,
      String orderStatus,
      String razorpayOrderId,
      String razorpayPaymentId,
      String createdAt,
      List<OrderItemPayload> items,
      String currency,
      Integer amountPaise,
      String razorpayKeyId
  ) {}

  public record UpdateOrderStatusRequest(String orderStatus) {}

  // ── Variant DTOs ────────────────────────────────────────────────────────────

  public record VariantMediaResponse(
      Long id,
      String mediaUrl,
      String mediaType,
      Integer displayOrder,
      Boolean isPrimary
  ) {}

  public record VariantResponse(
      Long id,
      Long productId,
      String colorName,
      String hexCode,
      String size,
      java.math.BigDecimal price,
      Integer priceAdjustment,
      Integer stock,
      String sku,
      Boolean isDefault,
      Integer displayOrder,
      List<VariantMediaResponse> media
  ) {}

  public record VariantPayload(
      String colorName,
      String hexCode,
      String size,
      java.math.BigDecimal price,
      Integer priceAdjustment,
      Integer stock,
      String sku,
      Boolean isDefault,
      Integer displayOrder
  ) {}

  public record VariantMediaPayload(
      String mediaUrl,
      String mediaType,
      Integer displayOrder,
      Boolean isPrimary
  ) {}
}
