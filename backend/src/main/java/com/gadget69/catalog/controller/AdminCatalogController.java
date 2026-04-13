package com.gadget69.catalog.controller;

import com.gadget69.catalog.dto.ApiDtos;
import com.gadget69.catalog.entity.AdminUser;
import com.gadget69.catalog.entity.Banner;
import com.gadget69.catalog.entity.CommunityMedia;
import com.gadget69.catalog.entity.CustomerOrder;
import com.gadget69.catalog.entity.Product;
import com.gadget69.catalog.entity.Section;
import com.gadget69.catalog.entity.StoreSettings;
import com.gadget69.catalog.mapper.CatalogMapper;
import com.gadget69.catalog.repository.BannerRepository;
import com.gadget69.catalog.repository.CommunityMediaRepository;
import com.gadget69.catalog.repository.CustomerOrderRepository;
import com.gadget69.catalog.repository.ProductRepository;
import com.gadget69.catalog.repository.SectionRepository;
import com.gadget69.catalog.repository.StoreSettingsRepository;
import com.gadget69.catalog.service.AuthTokenService;
import com.gadget69.catalog.service.UploadStorageService;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
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
  private final CustomerOrderRepository customerOrderRepository;
  private final CatalogMapper catalogMapper;

  @PostMapping("/login")
  public ApiDtos.AdminLoginResponse login(@RequestBody ApiDtos.AdminLoginRequest request) {
    String token = authTokenService.login(request.email(), request.password());
    return new ApiDtos.AdminLoginResponse(token, "Login successful");
  }

  @PostMapping("/change-password")
  public ResponseEntity<Void> changePassword(HttpServletRequest httpRequest,
      @RequestBody ApiDtos.ChangePasswordRequest request) {
    AdminUser adminUser = authTokenService.requireAdmin(httpRequest);
    authTokenService.changePassword(adminUser, request.currentPassword(), request.newPassword());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/dashboard")
  public ApiDtos.DashboardStatsResponse dashboard(HttpServletRequest httpRequest) {
    authTokenService.requireAdmin(httpRequest);

    BigDecimal totalRevenue = customerOrderRepository.findAllByOrderByCreatedAtDesc().stream()
        .map(CustomerOrder::getTotalAmount)
        .filter(amount -> amount != null)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    return new ApiDtos.DashboardStatsResponse(
        customerOrderRepository.count(),
        totalRevenue,
        productRepository.count(),
        sectionRepository.count(),
        bannerRepository.count(),
        communityMediaRepository.count()
    );
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
    return catalogMapper.toProductResponse(productRepository.save(product));
  }

  @PutMapping("/products/{id}")
  public ApiDtos.ProductResponse updateProduct(HttpServletRequest httpRequest, @PathVariable Long id,
      @RequestBody ApiDtos.ProductPayload payload) {
    authTokenService.requireAdmin(httpRequest);
    Product product = productRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    applyProduct(product, payload);
    return catalogMapper.toProductResponse(productRepository.save(product));
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
    UploadStorageService.StoredFile storedFile = uploadStorageService.store(file);
    return new ApiDtos.UploadResponse(
        catalogMapper.toPublicMediaUrl(storedFile.path()),
        storedFile.fileName(),
        storedFile.mediaType()
    );
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
    product.setOffer(payload.offer() == null ? false : payload.offer());
    product.setOfferPrice(payload.offerPrice());
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
    product.setGalleryImages(payload.galleryImages() == null ? new ArrayList<>() : new ArrayList<>(payload.galleryImages()));
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

  private void applySettings(StoreSettings settings, ApiDtos.SettingsPayload payload) {
    settings.setSiteTitle(requiredValue(payload.siteTitle(), "Site title is required"));
    settings.setMetaDescription(payload.metaDescription());
    settings.setLogoUrl(payload.logoUrl());
    settings.setFaviconUrl(payload.faviconUrl());
    settings.setFooterText(payload.footerText());
    settings.setAnnouncementItems(payload.announcementItems() == null ? new ArrayList<>() : new ArrayList<>(payload.announcementItems()));
    settings.setInstagramUrl(payload.instagramUrl());
    settings.setFacebookUrl(payload.facebookUrl());
    settings.setWhatsappNumber(payload.whatsappNumber());
    settings.setCatalogueUrl(payload.catalogueUrl());
    settings.setContactUrl(payload.contactUrl());
  }

  private void applyCommunityMedia(CommunityMedia media, ApiDtos.CommunityMediaPayload payload) {
    media.setTitle(payload.title());
    media.setCaption(payload.caption());
    media.setMediaType(blankToDefault(payload.mediaType(), "IMAGE").toUpperCase());
    media.setImageUrl(payload.imageUrl());
    media.setVideoUrl(payload.videoUrl());
    media.setThumbnailUrl(payload.thumbnailUrl());
    media.setActionLink(payload.actionLink());
    media.setDisplayOrder(payload.displayOrder() == null ? 0 : payload.displayOrder());
    media.setIsActive(payload.isActive() == null ? true : payload.isActive());
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

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private String blankToDefault(String value, String defaultValue) {
    return value == null || value.isBlank() ? defaultValue : value.trim();
  }
}
