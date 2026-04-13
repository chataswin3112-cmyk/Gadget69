package com.gadget69.catalog.dto;

import java.math.BigDecimal;
import java.util.List;

public final class ApiDtos {

  private ApiDtos() {
  }

  public record AdminLoginRequest(String email, String password) {}

  public record AdminLoginResponse(String token, String message) {}

  public record ChangePasswordRequest(String currentPassword, String newPassword) {}

  public record UploadResponse(String url, String fileName, String mediaType) {}

  public record DashboardStatsResponse(
      long totalOrders,
      BigDecimal totalRevenue,
      long totalProducts,
      long totalSections,
      long totalBanners,
      long totalCommunityMedia
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
      List<String> galleryImages
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
      List<String> galleryImages
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
      String actionLink,
      Integer displayOrder,
      Boolean isActive
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
      String razorpayOrderId,
      String razorpayPaymentId,
      String createdAt,
      List<OrderItemPayload> items
  ) {}
}
