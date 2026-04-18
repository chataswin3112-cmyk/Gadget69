package com.gadget69.catalog.controller;

import com.gadget69.catalog.dto.ApiDtos;
import com.gadget69.catalog.entity.AdminUser;
import com.gadget69.catalog.entity.Banner;
import com.gadget69.catalog.entity.CommunityMedia;
import com.gadget69.catalog.entity.CustomerOrder;
import com.gadget69.catalog.entity.Product;
import com.gadget69.catalog.entity.Review;
import com.gadget69.catalog.entity.Section;
import com.gadget69.catalog.entity.StoreSettings;
import com.gadget69.catalog.mapper.CatalogMapper;
import com.gadget69.catalog.repository.BannerRepository;
import com.gadget69.catalog.repository.CommunityMediaRepository;
import com.gadget69.catalog.repository.CustomerOrderRepository;
import com.gadget69.catalog.repository.ProductRepository;
import com.gadget69.catalog.repository.ReviewRepository;
import com.gadget69.catalog.repository.SectionRepository;
import com.gadget69.catalog.repository.StoreSettingsRepository;
import com.gadget69.catalog.service.AuthTokenService;
import com.gadget69.catalog.service.CatalogSyncService;
import com.gadget69.catalog.service.CloudinaryCommunityVideoService;
import com.gadget69.catalog.service.OtpService;
import com.gadget69.catalog.service.UploadStorageService;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminCatalogController {

  private final AuthTokenService authTokenService;
  private final UploadStorageService uploadStorageService;
  private final SectionRepository sectionRepository;
  private final ProductRepository productRepository;
  private final BannerRepository bannerRepository;
  private final StoreSettingsRepository storeSettingsRepository;
  private final CommunityMediaRepository communityMediaRepository;
  private final ReviewRepository reviewRepository;
  private final CustomerOrderRepository customerOrderRepository;
  private final CatalogMapper catalogMapper;
  private final CloudinaryCommunityVideoService cloudinaryCommunityVideoService;
  private final OtpService otpService;
  private final CatalogSyncService catalogSyncService;

  @PostMapping("/login")
  public ApiDtos.AdminLoginResponse login(@RequestBody ApiDtos.AdminLoginRequest request) {
    String token = authTokenService.login(request.email(), request.password());
    return new ApiDtos.AdminLoginResponse(token, "Login successful");
  }

  @PostMapping("/request-password-otp")
  public ApiDtos.OtpDispatchResponse requestPasswordOtp(HttpServletRequest httpRequest) {
    AdminUser adminUser = authTokenService.requireAdmin(httpRequest);
    StoreSettings settings = getOrCreateSettings();
    OtpService.OtpDispatchResult result =
        otpService.sendPasswordOtp(adminUser, settings.getWhatsappNumber());
    return new ApiDtos.OtpDispatchResponse(result.message(), result.recipient());
  }

  @PostMapping("/change-password-with-otp")
  public ResponseEntity<Void> changePasswordWithOtp(HttpServletRequest httpRequest,
      @RequestBody ApiDtos.OtpPasswordChangeRequest request) {
    AdminUser adminUser = authTokenService.requireAdmin(httpRequest);
    otpService.verifyOtpAndChangePassword(request.otp(), request.newPassword(), adminUser, authTokenService);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/change-password")
  public ResponseEntity<Void> changePassword(HttpServletRequest httpRequest,
      @RequestBody ApiDtos.ChangePasswordRequest request) {
    AdminUser adminUser = authTokenService.requireAdmin(httpRequest);
    authTokenService.changePassword(adminUser, request.currentPassword(), request.newPassword());
    return ResponseEntity.noContent().build();
  }

  /** Public endpoint — no auth token required. Validates the secret key from application config. */
  @PostMapping("/reset-password-with-key")
  public ResponseEntity<Void> resetPasswordWithKey(
      @RequestBody ApiDtos.ResetPasswordWithKeyRequest request) {
    authTokenService.resetPasswordWithSecretKey(request.secretKey(), request.newPassword());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/dashboard")
  public ApiDtos.DashboardStatsResponse dashboard(HttpServletRequest httpRequest) {
    authTokenService.requireAdmin(httpRequest);

    List<CustomerOrder> allOrders = customerOrderRepository.findAllByOrderByCreatedAtDesc();
    List<CustomerOrder> paidOrders = allOrders.stream()
        .filter(order -> "PAID".equalsIgnoreCase(order.getPaymentStatus()))
        .toList();

    BigDecimal totalRevenue = paidOrders.stream()
        .map(CustomerOrder::getTotalAmount)
        .filter(amount -> amount != null)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal conversionRate = allOrders.isEmpty()
        ? BigDecimal.ZERO
        : BigDecimal.valueOf(paidOrders.size())
            .multiply(BigDecimal.valueOf(100))
            .divide(BigDecimal.valueOf(allOrders.size()), 2, RoundingMode.HALF_UP);

    Map<Long, TopSellingStats> topSelling = new HashMap<>();
    for (CustomerOrder order : paidOrders) {
      for (var item : order.getItems()) {
        if (item.getProductId() == null || item.getPrice() == null) {
          continue;
        }
        int quantity = item.getQuantity() == null ? 0 : item.getQuantity();
        BigDecimal lineRevenue = item.getPrice().multiply(BigDecimal.valueOf(quantity));
        topSelling.compute(item.getProductId(), (productId, existing) -> {
          if (existing == null) {
            return new TopSellingStats(item.getProductName(), quantity, lineRevenue);
          }
          return new TopSellingStats(
              existing.productName(),
              existing.unitsSold() + quantity,
              existing.revenue().add(lineRevenue));
        });
      }
    }

    List<ApiDtos.TopSellingProductResponse> topSellingProducts = topSelling.entrySet().stream()
        .map(entry -> new ApiDtos.TopSellingProductResponse(
            entry.getKey(),
            entry.getValue().productName(),
            entry.getValue().unitsSold(),
            entry.getValue().revenue()))
        .sorted((left, right) -> {
          int byUnits = Integer.compare(right.unitsSold(), left.unitsSold());
          if (byUnits != 0) {
            return byUnits;
          }
          int byRevenue = right.revenue().compareTo(left.revenue());
          if (byRevenue != 0) {
            return byRevenue;
          }
          return left.productName().compareToIgnoreCase(right.productName());
        })
        .toList();

    return new ApiDtos.DashboardStatsResponse(
        allOrders.size(),
        paidOrders.size(),
        totalRevenue,
        conversionRate,
        productRepository.count(),
        sectionRepository.count(),
        bannerRepository.count(),
        communityMediaRepository.count(),
        topSellingProducts);
  }

  @PostMapping("/catalog/replace-demo-data")
  public CatalogSyncService.CatalogSyncResult replaceDemoCatalog(HttpServletRequest httpRequest) {
    authTokenService.requireAdmin(httpRequest);
    return catalogSyncService.replaceDemoData();
  }

  @GetMapping("/sections")
  public List<ApiDtos.SectionResponse> adminSections(HttpServletRequest httpRequest) {
    authTokenService.requireAdmin(httpRequest);
    return sectionRepository.findAllByOrderBySortOrderAscNameAsc().stream()
        .map(catalogMapper::toSectionResponse)
        .toList();
  }

  @PostMapping("/sections")
  public ApiDtos.SectionResponse createSection(HttpServletRequest httpRequest,
      @RequestBody ApiDtos.SectionPayload payload) {
    authTokenService.requireAdmin(httpRequest);
    Section section = new Section();
    applySection(section, payload);
    return catalogMapper.toSectionResponse(sectionRepository.save(section));
  }

  @PutMapping("/sections/{id}")
  public ApiDtos.SectionResponse updateSection(HttpServletRequest httpRequest, @PathVariable Long id,
      @RequestBody ApiDtos.SectionPayload payload) {
    authTokenService.requireAdmin(httpRequest);
    Section section = sectionRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));
    applySection(section, payload);
    return catalogMapper.toSectionResponse(sectionRepository.save(section));
  }

  @DeleteMapping("/sections/{id}")
  public ResponseEntity<Void> deleteSection(HttpServletRequest httpRequest, @PathVariable Long id) {
    authTokenService.requireAdmin(httpRequest);
    if (productRepository.countBySection_Id(id) > 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Delete products in this category before deleting the category");
    }
    sectionRepository.deleteById(id);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/products")
  public List<ApiDtos.ProductResponse> adminProducts(HttpServletRequest httpRequest) {
    authTokenService.requireAdmin(httpRequest);
    return productRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc().stream()
        .map(catalogMapper::toProductResponse)
        .toList();
  }

  @PostMapping("/products")
  public ApiDtos.ProductResponse createProduct(HttpServletRequest httpRequest,
      @RequestBody ApiDtos.ProductPayload payload) {
    authTokenService.requireAdmin(httpRequest);
    Product product = new Product();
    applyProduct(product, payload);
    return saveAndMapProduct(product);
  }

  @PutMapping("/products/{id}")
  public ApiDtos.ProductResponse updateProduct(HttpServletRequest httpRequest, @PathVariable Long id,
      @RequestBody ApiDtos.ProductPayload payload) {
    authTokenService.requireAdmin(httpRequest);
    Product product = productRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    applyProduct(product, payload);
    return saveAndMapProduct(product);
  }

  @DeleteMapping("/products/{id}")
  public ResponseEntity<Void> deleteProduct(HttpServletRequest httpRequest, @PathVariable Long id) {
    authTokenService.requireAdmin(httpRequest);
    productRepository.deleteById(id);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/banners")
  public List<ApiDtos.BannerResponse> adminBanners(HttpServletRequest httpRequest) {
    authTokenService.requireAdmin(httpRequest);
    return bannerRepository.findAllByOrderByDisplayOrderAscIdAsc().stream()
        .map(catalogMapper::toBannerResponse)
        .toList();
  }

  @PostMapping("/banners")
  public ApiDtos.BannerResponse createBanner(HttpServletRequest httpRequest,
      @RequestBody ApiDtos.BannerPayload payload) {
    authTokenService.requireAdmin(httpRequest);
    Banner banner = new Banner();
    applyBanner(banner, payload);
    return catalogMapper.toBannerResponse(bannerRepository.save(banner));
  }

  @PutMapping("/banners/{id}")
  public ApiDtos.BannerResponse updateBanner(HttpServletRequest httpRequest, @PathVariable Long id,
      @RequestBody ApiDtos.BannerPayload payload) {
    authTokenService.requireAdmin(httpRequest);
    Banner banner = bannerRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Banner not found"));
    applyBanner(banner, payload);
    return catalogMapper.toBannerResponse(bannerRepository.save(banner));
  }

  @DeleteMapping("/banners/{id}")
  public ResponseEntity<Void> deleteBanner(HttpServletRequest httpRequest, @PathVariable Long id) {
    authTokenService.requireAdmin(httpRequest);
    bannerRepository.deleteById(id);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/settings")
  public ApiDtos.SettingsResponse adminSettings(HttpServletRequest httpRequest) {
    authTokenService.requireAdmin(httpRequest);
    return catalogMapper.toSettingsResponse(getOrCreateSettings());
  }

  @PutMapping("/settings")
  public ApiDtos.SettingsResponse updateSettings(HttpServletRequest httpRequest,
      @RequestBody ApiDtos.SettingsPayload payload) {
    authTokenService.requireAdmin(httpRequest);
    StoreSettings settings = getOrCreateSettings();
    applySettings(settings, payload);
    return catalogMapper.toSettingsResponse(storeSettingsRepository.save(settings));
  }

  @GetMapping("/community-media")
  public List<ApiDtos.CommunityMediaResponse> adminCommunityMedia(HttpServletRequest httpRequest) {
    authTokenService.requireAdmin(httpRequest);
    return communityMediaRepository.findAllByOrderByDisplayOrderAscIdAsc().stream()
        .map(catalogMapper::toCommunityMediaResponse)
        .toList();
  }

  @GetMapping("/reviews")
  public List<ApiDtos.ReviewResponse> adminReviews(HttpServletRequest httpRequest) {
    authTokenService.requireAdmin(httpRequest);
    return reviewRepository.findAllByOrderByReviewDateDescIdDesc().stream()
        .map(catalogMapper::toReviewResponse)
        .toList();
  }

  @PostMapping("/reviews")
  public ApiDtos.ReviewResponse createReview(HttpServletRequest httpRequest,
      @RequestBody ApiDtos.ReviewPayload payload) {
    authTokenService.requireAdmin(httpRequest);
    Review review = new Review();
    applyReview(review, payload);
    return catalogMapper.toReviewResponse(reviewRepository.save(review));
  }

  @PutMapping("/reviews/{id}")
  public ApiDtos.ReviewResponse updateReview(HttpServletRequest httpRequest, @PathVariable Long id,
      @RequestBody ApiDtos.ReviewPayload payload) {
    authTokenService.requireAdmin(httpRequest);
    Review review = reviewRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));
    applyReview(review, payload);
    return catalogMapper.toReviewResponse(reviewRepository.save(review));
  }

  @DeleteMapping("/reviews/{id}")
  public ResponseEntity<Void> deleteReview(HttpServletRequest httpRequest, @PathVariable Long id) {
    authTokenService.requireAdmin(httpRequest);
    reviewRepository.deleteById(id);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/community-media")
  public ApiDtos.CommunityMediaResponse createCommunityMedia(HttpServletRequest httpRequest,
      @RequestBody ApiDtos.CommunityMediaPayload payload) {
    authTokenService.requireAdmin(httpRequest);
    CommunityMedia media = new CommunityMedia();
    applyCommunityMedia(media, payload);
    return catalogMapper.toCommunityMediaResponse(communityMediaRepository.save(media));
  }

  @PutMapping("/community-media/{id}")
  public ApiDtos.CommunityMediaResponse updateCommunityMedia(HttpServletRequest httpRequest, @PathVariable Long id,
      @RequestBody ApiDtos.CommunityMediaPayload payload) {
    authTokenService.requireAdmin(httpRequest);
    CommunityMedia media = communityMediaRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Community media item not found"));
    applyCommunityMedia(media, payload);
    return catalogMapper.toCommunityMediaResponse(communityMediaRepository.save(media));
  }

  @DeleteMapping("/community-media/{id}")
  public ResponseEntity<Void> deleteCommunityMedia(HttpServletRequest httpRequest, @PathVariable Long id) {
    authTokenService.requireAdmin(httpRequest);
    communityMediaRepository.deleteById(id);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/community-media/upload-signature")
  public ApiDtos.CommunityVideoUploadSignatureResponse communityMediaUploadSignature(
      HttpServletRequest httpRequest,
      @RequestBody ApiDtos.CommunityVideoUploadSignatureRequest request) {
    authTokenService.requireAdmin(httpRequest);
    return cloudinaryCommunityVideoService.createUploadSignature(request);
  }

  @GetMapping("/orders")
  public List<ApiDtos.OrderResponse> adminOrders(HttpServletRequest httpRequest) {
    authTokenService.requireAdmin(httpRequest);
    return customerOrderRepository.findAllByOrderByCreatedAtDesc().stream()
        .map(catalogMapper::toOrderResponse)
        .toList();
  }

  @PostMapping("/upload")
  public ApiDtos.UploadResponse upload(HttpServletRequest httpRequest,
      @RequestParam("file") MultipartFile file) {
    authTokenService.requireAdmin(httpRequest);

    // Validate file is not empty
    if (file == null || file.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file provided");
    }

    // Enforce maximum file size: 10 MB
    long maxFileSizeBytes = 10L * 1024 * 1024;
    if (file.getSize() > maxFileSizeBytes) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "File too large. Maximum allowed size is 10 MB.");
    }

    // Whitelist allowed file types (images only for product/banner uploads)
    String contentType = file.getContentType();
    java.util.Set<String> allowedTypes = java.util.Set.of(
        "image/jpeg", "image/jpg", "image/png", "image/webp",
        "image/gif", "image/svg+xml"
    );
    if (contentType == null || !allowedTypes.contains(contentType.toLowerCase())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Invalid file type. Only JPEG, PNG, WebP, GIF, or SVG images are allowed.");
    }

    // Validate filename extension as a secondary check
    String originalFilename = file.getOriginalFilename();
    if (originalFilename != null) {
      String lower = originalFilename.toLowerCase();
      boolean validExtension = lower.endsWith(".jpg") || lower.endsWith(".jpeg")
          || lower.endsWith(".png") || lower.endsWith(".webp")
          || lower.endsWith(".gif") || lower.endsWith(".svg");
      if (!validExtension) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Invalid file extension. Allowed: jpg, jpeg, png, webp, gif, svg");
      }
    }

    UploadStorageService.StoredFile storedFile = uploadStorageService.store(file);
    return new ApiDtos.UploadResponse(
        catalogMapper.toPublicMediaUrl(storedFile.path()),
        storedFile.fileName(),
        storedFile.mediaType());
  }

  private StoreSettings getOrCreateSettings() {
    return storeSettingsRepository.findTopByOrderByIdAsc().orElseGet(() -> {
      StoreSettings settings = new StoreSettings();
      settings.setSiteTitle("Gadget69");
      settings.setAnnouncementItems(List.of());
      return storeSettingsRepository.save(settings);
    });
  }

  private void applySection(Section section, ApiDtos.SectionPayload payload) {
    section.setName(requiredValue(payload.name(), "Section name is required"));
    section.setDescription(payload.description());
    section.setImageUrl(payload.imageUrl());
    section.setIsActive(payload.is_active() == null ? true : payload.is_active());
    section.setShowInExplore(payload.show_in_explore() == null ? true : payload.show_in_explore());
    section.setShowInTopCategory(payload.show_in_top_category() == null ? false : payload.show_in_top_category());
    section.setAccentTone(payload.accent_tone());
    section.setSortOrder(payload.sort_order() == null ? 0 : payload.sort_order());
  }

  private void applyProduct(Product product, ApiDtos.ProductPayload payload) {
    Section section = sectionRepository.findById(payload.sectionId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid category"));

    product.setName(requiredValue(payload.name(), "Product name is required"));
    product.setDescription(requiredValue(payload.description(), "Product description is required"));
    product.setPrice(requiredNumber(payload.price(), "Product price is required"));
    product.setStockQuantity(payload.stockQuantity() == null ? 0 : payload.stockQuantity());
    product.setSection(section);
    product.setImageUrl(payload.imageUrl());
    product.setVideoUrl(payload.videoUrl());
    boolean offerEnabled = payload.offer() == null ? false : payload.offer();
    validateOfferSchedule(offerEnabled, payload.offerPrice(), payload.offerStartDate(), payload.offerEndDate());
    product.setOffer(offerEnabled);
    product.setOfferPrice(offerEnabled ? payload.offerPrice() : null);
    product.setOfferStartDate(offerEnabled ? payload.offerStartDate() : null);
    product.setOfferEndDate(offerEnabled ? payload.offerEndDate() : null);
    product.setSlug(blankToNull(payload.slug()));
    product.setModelNumber(blankToNull(payload.model_number()));
    product.setShortDescription(blankToNull(payload.short_description()));
    product.setMrp(payload.mrp());
    product.setDisplayOrder(payload.display_order() == null ? 0 : payload.display_order());
    product.setIsNewLaunch(payload.is_new_launch() == null ? false : payload.is_new_launch());
    product.setIsBestSeller(payload.is_best_seller() == null ? false : payload.is_best_seller());
    product.setIsFeatured(payload.is_featured() == null ? false : payload.is_featured());
    product.setIsHeroFeatured(payload.is_hero_featured() == null ? false : payload.is_hero_featured());
    product.setStatus(blankToDefault(payload.status(), "ACTIVE"));
    product.setDefaultThumbnailUrl(blankToNull(payload.default_thumbnail_url()));
    product.setGalleryImages(
        payload.galleryImages() == null ? new ArrayList<>() : new ArrayList<>(payload.galleryImages()));
    product.setSpecifications(
        payload.specifications() == null ? new java.util.LinkedHashMap<>() : new java.util.LinkedHashMap<>(payload.specifications()));
  }

  private void applyBanner(Banner banner, ApiDtos.BannerPayload payload) {
    banner.setTitle(payload.title());
    banner.setDesktopImageUrl(requiredValue(payload.desktopImageUrl(), "Banner image is required"));
    banner.setMobileImageUrl(payload.mobileImageUrl());
    banner.setCtaText(payload.ctaText());
    banner.setCtaLink(payload.ctaLink());
    banner.setLinkedProductId(payload.linkedProductId());
    banner.setDisplayOrder(payload.displayOrder() == null ? 0 : payload.displayOrder());
    banner.setIsActive(payload.isActive() == null ? true : payload.isActive());
  }

  private ApiDtos.ProductResponse saveAndMapProduct(Product product) {
    Product saved = productRepository.save(product);
    Product hydrated = productRepository.findById(saved.getId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    return catalogMapper.toProductResponse(hydrated);
  }

  private void applySettings(StoreSettings settings, ApiDtos.SettingsPayload payload) {
    settings.setSiteTitle(requiredValue(payload.siteTitle(), "Site title is required"));
    settings.setMetaDescription(payload.metaDescription());
    settings.setLogoUrl(payload.logoUrl());
    settings.setFaviconUrl(payload.faviconUrl());
    settings.setFooterText(payload.footerText());
    settings.setAnnouncementItems(
        payload.announcementItems() == null ? new ArrayList<>() : new ArrayList<>(payload.announcementItems()));
    settings.setInstagramUrl(payload.instagramUrl());
    settings.setFacebookUrl(payload.facebookUrl());
    settings.setWhatsappNumber(payload.whatsappNumber());
    settings.setCatalogueUrl(payload.catalogueUrl());
    settings.setContactUrl(payload.contactUrl());
  }

  private void applyCommunityMedia(CommunityMedia media, ApiDtos.CommunityMediaPayload payload) {
    String mediaType = blankToDefault(payload.mediaType(), "IMAGE").toUpperCase();

    media.setTitle(blankToNull(payload.title()));
    media.setCaption(blankToNull(payload.caption()));
    media.setMediaType(mediaType);
    media.setImageUrl(blankToNull(payload.imageUrl()));

    if ("VIDEO".equals(mediaType)) {
      media.setVideoUrl(blankToNull(payload.videoUrl()));
      media.setVideoPublicId(blankToNull(payload.videoPublicId()));
      media.setVideoWidth(payload.videoWidth());
      media.setVideoHeight(payload.videoHeight());
      media.setVideoDuration(payload.videoDuration());
      media.setThumbnailUrl(resolveVideoThumbnail(payload));
    } else {
      media.setVideoUrl(null);
      media.setVideoPublicId(null);
      media.setVideoWidth(null);
      media.setVideoHeight(null);
      media.setVideoDuration(null);
      media.setThumbnailUrl(blankToNull(payload.thumbnailUrl()));
    }

    media.setActionLink(payload.actionLink());
    media.setDisplayOrder(payload.displayOrder() == null ? 0 : payload.displayOrder());
    media.setIsActive(payload.isActive() == null ? true : payload.isActive());
  }

  private void applyReview(Review review, ApiDtos.ReviewPayload payload) {
    if (payload == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review payload is required");
    }

    int rating = payload.rating() == null ? 5 : payload.rating();
    if (rating < 1 || rating > 5) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
    }

    review.setName(requiredValue(payload.name(), "Reviewer name is required"));
    review.setRating(rating);
    review.setComment(requiredValue(payload.comment(), "Review comment is required"));
    review.setAvatar(blankToNull(payload.avatar()));
    review.setReviewDate(payload.date() == null ? LocalDate.now() : payload.date());
  }

  private String resolveVideoThumbnail(ApiDtos.CommunityMediaPayload payload) {
    String thumbnailUrl = blankToNull(payload.thumbnailUrl());
    if (thumbnailUrl != null) {
      return thumbnailUrl;
    }
    String publicId = blankToNull(payload.videoPublicId());
    if (publicId == null) {
      return null;
    }
    return cloudinaryCommunityVideoService.buildPosterUrl(publicId);
  }

  private String requiredValue(String value, String message) {
    if (value == null || value.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
    return value.trim();
  }

  private BigDecimal requiredNumber(BigDecimal value, String message) {
    if (value == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
    return value;
  }

  private void validateOfferSchedule(boolean offerEnabled, BigDecimal offerPrice,
      LocalDate offerStartDate, LocalDate offerEndDate) {
    if (!offerEnabled) {
      return;
    }

    if (offerPrice == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Offer price is required");
    }
    if (offerStartDate == null || offerEndDate == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Offer start and end dates are required");
    }
    if (offerEndDate.isBefore(offerStartDate)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Offer end date cannot be before offer start date");
    }
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private String blankToDefault(String value, String defaultValue) {
    return value == null || value.isBlank() ? defaultValue : value.trim();
  }

  private record TopSellingStats(String productName, int unitsSold, BigDecimal revenue) {
  }
}
