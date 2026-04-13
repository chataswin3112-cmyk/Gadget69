package com.gadget69.catalog.service;

import com.gadget69.catalog.entity.AdminUser;
import com.gadget69.catalog.entity.Banner;
import com.gadget69.catalog.entity.CommunityMedia;
import com.gadget69.catalog.entity.Product;
import com.gadget69.catalog.entity.Section;
import com.gadget69.catalog.entity.StoreSettings;
import com.gadget69.catalog.repository.AdminUserRepository;
import com.gadget69.catalog.repository.BannerRepository;
import com.gadget69.catalog.repository.CommunityMediaRepository;
import com.gadget69.catalog.repository.ProductRepository;
import com.gadget69.catalog.repository.SectionRepository;
import com.gadget69.catalog.repository.StoreSettingsRepository;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SeedDataService implements ApplicationRunner {

  private final AdminUserRepository adminUserRepository;
  private final SectionRepository sectionRepository;
  private final ProductRepository productRepository;
  private final BannerRepository bannerRepository;
  private final StoreSettingsRepository storeSettingsRepository;
  private final CommunityMediaRepository communityMediaRepository;
  private final AuthTokenService authTokenService;

  @Override
  public void run(ApplicationArguments args) {
    seedAdmin();
    seedCatalog();
    seedSettings();
    seedCommunityMedia();
  }

  private void seedAdmin() {
    if (adminUserRepository.count() > 0) {
      return;
    }
    AdminUser adminUser = new AdminUser();
    adminUser.setName("Gadget69 Admin");
    adminUser.setEmail("admin@gadget69.com");
    adminUser.setPasswordHash(authTokenService.encodePassword("admin123"));
    adminUserRepository.save(adminUser);
  }

  private void seedCatalog() {
    if (sectionRepository.count() == 0) {
      Section smartphones = createSection("Smartphones", "Premium flagship smartphones",
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900", true, true, true, 0);
      Section laptops = createSection("Laptops", "Ultra-thin powerhouse laptops",
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900", true, true, true, 1);
      Section audio = createSection("Audio", "Hi-fi headphones and speakers",
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900", true, true, true, 2);
      sectionRepository.saveAll(List.of(smartphones, laptops, audio));
    }

    if (productRepository.count() == 0) {
      List<Section> sections = sectionRepository.findAllByOrderBySortOrderAscNameAsc();
      Section smartphones = sections.get(0);
      Section laptops = sections.get(1);
      Section audio = sections.get(2);

      productRepository.saveAll(List.of(
          createProduct("Gadget Pro Max", "Titanium flagship phone with pro-grade camera system.", new BigDecimal("129999"),
              25, smartphones, "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=900",
              List.of(
                  "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=900",
                  "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=900"
              ), null, true, new BigDecimal("114999"), new BigDecimal("139999"), "G69-PM-001", 0, true, false, true),
          createProduct("Gadget Book Air", "Slim performance laptop built for creators and teams.", new BigDecimal("149999"),
              15, laptops, "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900",
              List.of(
                  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900",
                  "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=900"
              ), null, true, new BigDecimal("134999"), new BigDecimal("159999"), "G69-BA-001", 1, false, true, true),
          createProduct("Gadget Pods Elite", "Immersive earbuds with spatial audio and adaptive noise canceling.", new BigDecimal("24999"),
              100, audio, "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=900",
              List.of(
                  "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=900",
                  "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=900"
              ), null, true, new BigDecimal("19999"), new BigDecimal("24999"), "G69-PE-001", 2, true, true, false)
      ));
    }

    if (bannerRepository.count() == 0) {
      Banner bannerOne = new Banner();
      bannerOne.setTitle("New Gadget Pro Max");
      bannerOne.setDesktopImageUrl("https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1600&h=700&fit=crop");
      bannerOne.setCtaText("Shop Now");
      bannerOne.setCtaLink("/products/1");
      bannerOne.setDisplayOrder(0);

      Banner bannerTwo = new Banner();
      bannerTwo.setTitle("Pure Sound, All Day");
      bannerTwo.setDesktopImageUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&h=700&fit=crop");
      bannerTwo.setCtaText("Explore Audio");
      bannerTwo.setCtaLink("/categories/3");
      bannerTwo.setDisplayOrder(1);

      bannerRepository.saveAll(List.of(bannerOne, bannerTwo));
    }
  }

  private void seedSettings() {
    if (storeSettingsRepository.findTopByOrderByIdAsc().isPresent()) {
      return;
    }
    StoreSettings settings = new StoreSettings();
    settings.setSiteTitle("Gadget69");
    settings.setMetaDescription("Premium electronics crafted for those who demand excellence.");
    settings.setFooterText("Premium electronics crafted for those who demand excellence. Experience luxury technology.");
    settings.setAnnouncementItems(List.of(
        "Free shipping on orders over Rs. 999",
        "New arrivals every week",
        "Easy admin updates for products, banners, and media"
    ));
    settings.setInstagramUrl("https://instagram.com");
    settings.setFacebookUrl("https://facebook.com");
    settings.setWhatsappNumber("919876543210");
    settings.setCatalogueUrl("#");
    settings.setContactUrl("/contact");
    storeSettingsRepository.save(settings);
  }

  private void seedCommunityMedia() {
    if (communityMediaRepository.count() > 0) {
      return;
    }
    communityMediaRepository.saveAll(List.of(
        createCommunityMedia("Premium Sound Experience", "Premium Sound Experience", "IMAGE",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=700&fit=crop", null,
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=700&fit=crop", 0),
        createCommunityMedia("Smart Wearables", "Smart Wearables", "IMAGE",
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=700&fit=crop", null,
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=700&fit=crop", 1),
        createCommunityMedia("Studio Quality Audio", "Studio Quality Audio", "IMAGE",
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=700&fit=crop", null,
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=700&fit=crop", 2)
    ));
  }

  private Section createSection(String name, String description, String imageUrl, boolean active,
      boolean explore, boolean topCategory, int sortOrder) {
    Section section = new Section();
    section.setName(name);
    section.setDescription(description);
    section.setImageUrl(imageUrl);
    section.setIsActive(active);
    section.setShowInExplore(explore);
    section.setShowInTopCategory(topCategory);
    section.setSortOrder(sortOrder);
    return section;
  }

  private Product createProduct(String name, String description, BigDecimal price, int stockQuantity,
      Section section, String imageUrl, List<String> galleryImages, String videoUrl, boolean offer,
      BigDecimal offerPrice, BigDecimal mrp, String modelNumber, int displayOrder,
      boolean isNewLaunch, boolean isBestSeller, boolean isFeatured) {
    Product product = new Product();
    product.setName(name);
    product.setDescription(description);
    product.setPrice(price);
    product.setStockQuantity(stockQuantity);
    product.setSection(section);
    product.setImageUrl(imageUrl);
    product.setGalleryImages(galleryImages);
    product.setVideoUrl(videoUrl);
    product.setOffer(offer);
    product.setOfferPrice(offerPrice);
    product.setMrp(mrp);
    product.setModelNumber(modelNumber);
    product.setDisplayOrder(displayOrder);
    product.setIsNewLaunch(isNewLaunch);
    product.setIsBestSeller(isBestSeller);
    product.setIsFeatured(isFeatured);
    product.setDefaultThumbnailUrl(imageUrl);
    return product;
  }

  private CommunityMedia createCommunityMedia(String title, String caption, String mediaType,
      String imageUrl, String videoUrl, String thumbnailUrl, int displayOrder) {
    CommunityMedia media = new CommunityMedia();
    media.setTitle(title);
    media.setCaption(caption);
    media.setMediaType(mediaType);
    media.setImageUrl(imageUrl);
    media.setVideoUrl(videoUrl);
    media.setThumbnailUrl(thumbnailUrl);
    media.setDisplayOrder(displayOrder);
    media.setIsActive(true);
    return media;
  }
}
