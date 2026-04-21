package com.gadget69.catalog.service;

import com.gadget69.catalog.entity.AdminUser;
import com.gadget69.catalog.entity.Product;
import com.gadget69.catalog.entity.ProductMedia;
import com.gadget69.catalog.entity.Review;
import com.gadget69.catalog.entity.StoreSettings;
import com.gadget69.catalog.repository.AdminUserRepository;
import com.gadget69.catalog.repository.ProductMediaRepository;
import com.gadget69.catalog.repository.ProductRepository;
import com.gadget69.catalog.repository.ProductVariantRepository;
import com.gadget69.catalog.repository.ReviewRepository;
import com.gadget69.catalog.repository.SectionRepository;
import com.gadget69.catalog.repository.StoreSettingsRepository;
import com.gadget69.catalog.repository.VariantMediaRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class SeedDataService implements ApplicationRunner {

  private static final Logger LOGGER = LoggerFactory.getLogger(SeedDataService.class);
  private static final long DEFAULT_OFFER_LOOKBACK_DAYS = 1;
  private static final long DEFAULT_OFFER_DURATION_DAYS = 30;

  private final AdminUserRepository adminUserRepository;
  private final SectionRepository sectionRepository;
  private final ProductRepository productRepository;
  private final ProductMediaRepository productMediaRepository;
  private final ProductVariantRepository productVariantRepository;
  private final VariantMediaRepository variantMediaRepository;
  private final ReviewRepository reviewRepository;
  private final StoreSettingsRepository storeSettingsRepository;
  private final AuthTokenService authTokenService;
  private final CatalogSyncService catalogSyncService;
  private final JdbcTemplate jdbcTemplate;

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    seedAdmin();
    seedCatalog();
    seedSettings();
    seedReviews();
    backfillLegacyOfferSchedules();
    backfillStoreSettingsContacts();
    backfillProductMedia();
    backfillVariantMediaRoles();
    dropLegacyFacebookColumn();
  }

  private void seedAdmin() {
    AdminUser adminUser = adminUserRepository.findByEmailIgnoreCase("admin@gadget69.com")
        .orElseGet(AdminUser::new);
    boolean created = adminUser.getId() == null;
    boolean changed = false;

    if (adminUser.getName() == null || adminUser.getName().isBlank()) {
      adminUser.setName("Gadget69 Admin");
      changed = true;
    }
    if (adminUser.getEmail() == null || adminUser.getEmail().isBlank()) {
      adminUser.setEmail("admin@gadget69.com");
      changed = true;
    }
    if (adminUser.getPasswordHash() == null || adminUser.getPasswordHash().isBlank()) {
      adminUser.setPasswordHash(authTokenService.encodePassword("Admin@123"));
      changed = true;
    }
    if (adminUser.getTokenVersion() == null) {
      adminUser.setTokenVersion(0);
      changed = true;
    }

    if (created || changed) {
      adminUserRepository.save(adminUser);
    }

    if (created) {
      LOGGER.warn("""
          Initial admin account seeded
          Email: admin@gadget69.com
          Password: Admin@123
          Change this password immediately after first login.
          """);
    }
  }

  private void seedCatalog() {
    if (sectionRepository.count() == 0 && productRepository.count() == 0) {
      catalogSyncService.seedFreshCatalog();
    }
  }

  private void seedSettings() {
    if (storeSettingsRepository.findTopByOrderByIdAsc().isPresent()) {
      return;
    }
    StoreSettings settings = new StoreSettings();
    settings.setSiteTitle("Gadget69");
    settings.setMetaDescription("Practical electronics, accessories, and smart gadgets with secure online checkout.");
    settings.setFooterText("Practical electronics, accessories, and smart gadgets for everyday use.");
    settings.setAnnouncementItems(List.of(
        "Secure online checkout",
        "Curated gadgets and accessories",
        "Support available on WhatsApp"
    ));
    settings.setInstagramUrl("https://instagram.com");
    settings.setWhatsappNumber("919361586278");
    settings.setShopPhone("9361586278");
    settings.setSupportEmail("natrajganesh2000@gmail.com");
    settings.setCatalogueUrl("#");
    settings.setContactUrl("/contact");
    storeSettingsRepository.save(settings);
  }

  private void seedReviews() {
    if (reviewRepository.count() > 0) {
      return;
    }

    reviewRepository.saveAll(List.of(
        buildReview(
            "Aarav Nair",
            5,
            "Quick delivery, clean packaging, and the product quality felt premium right away.",
            LocalDate.of(2026, 4, 17)
        ),
        buildReview(
            "Meera Joseph",
            5,
            "Support was fast, the checkout felt smooth, and the gadget matched the photos perfectly.",
            LocalDate.of(2026, 4, 9)
        ),
        buildReview(
            "Karthik Rao",
            4,
            "Good value for the price. Setup was simple and the after-sales response was helpful.",
            LocalDate.of(2026, 3, 28)
        )
    ));
  }

  private void backfillLegacyOfferSchedules() {
    LocalDate defaultStartDate = LocalDate.now().minusDays(DEFAULT_OFFER_LOOKBACK_DAYS);
    LocalDate defaultEndDate = LocalDate.now().plusDays(DEFAULT_OFFER_DURATION_DAYS);

    List<Product> productsToBackfill = productRepository.findAll().stream()
        .filter(product -> Boolean.TRUE.equals(product.getOffer()))
        .filter(product -> product.getOfferPrice() != null)
        .filter(product -> product.getOfferStartDate() == null || product.getOfferEndDate() == null)
        .peek(product -> {
          if (product.getOfferStartDate() == null) {
            product.setOfferStartDate(defaultStartDate);
          }
          if (product.getOfferEndDate() == null) {
            product.setOfferEndDate(defaultEndDate);
          }
        })
        .toList();

    if (!productsToBackfill.isEmpty()) {
      productRepository.saveAll(productsToBackfill);
    }
  }

  private void backfillStoreSettingsContacts() {
    storeSettingsRepository.findTopByOrderByIdAsc().ifPresent(settings -> {
      boolean updated = false;
      if (settings.getWhatsappNumber() == null || settings.getWhatsappNumber().isBlank()) {
        settings.setWhatsappNumber("919361586278");
        updated = true;
      }
      if (settings.getShopPhone() == null || settings.getShopPhone().isBlank()) {
        settings.setShopPhone("9361586278");
        updated = true;
      }
      if (settings.getSupportEmail() == null || settings.getSupportEmail().isBlank()) {
        settings.setSupportEmail("natrajganesh2000@gmail.com");
        updated = true;
      }
      if (updated) {
        storeSettingsRepository.save(settings);
      }
    });
  }

  private void backfillProductMedia() {
    List<Product> productsToUpdate = new ArrayList<>();
    for (Product product : productRepository.findAll()) {
      if (!productMediaRepository.findByProductIdOrderByDisplayOrderAscIdAsc(product.getId()).isEmpty()) {
        continue;
      }

      int displayOrder = 0;
      boolean updated = false;
      if (product.getImageUrl() != null && !product.getImageUrl().isBlank()) {
        ProductMedia media = new ProductMedia();
        media.setProduct(product);
        media.setMediaUrl(product.getImageUrl());
        media.setMediaType("IMAGE");
        media.setMediaRole("MAIN");
        media.setDisplayOrder(displayOrder++);
        media.setIsPrimary(true);
        product.getMedia().add(media);
        updated = true;
      }
      if (product.getVideoUrl() != null && !product.getVideoUrl().isBlank()) {
        ProductMedia media = new ProductMedia();
        media.setProduct(product);
        media.setMediaUrl(product.getVideoUrl());
        media.setMediaType("VIDEO");
        media.setMediaRole("ADDITIONAL");
        media.setDisplayOrder(displayOrder++);
        media.setIsPrimary(false);
        product.getMedia().add(media);
        updated = true;
      }
      if (product.getGalleryImages() != null) {
        for (String galleryImage : product.getGalleryImages()) {
          if (galleryImage == null || galleryImage.isBlank()) {
            continue;
          }
          ProductMedia media = new ProductMedia();
          media.setProduct(product);
          media.setMediaUrl(galleryImage);
          media.setMediaType("IMAGE");
          media.setMediaRole("ADDITIONAL");
          media.setDisplayOrder(displayOrder++);
          media.setIsPrimary(false);
          product.getMedia().add(media);
          updated = true;
        }
      }
      if (updated) {
        productsToUpdate.add(product);
      }
    }

    if (!productsToUpdate.isEmpty()) {
      productRepository.saveAll(productsToUpdate);
    }
  }

  private void backfillVariantMediaRoles() {
    variantMediaRepository.findAll().forEach(media -> {
      if (media.getMediaRole() == null || media.getMediaRole().isBlank()) {
        media.setMediaRole(Boolean.TRUE.equals(media.getIsPrimary()) ? "MAIN" : "ADDITIONAL");
        variantMediaRepository.save(media);
      }
    });
  }

  private void dropLegacyFacebookColumn() {
    try {
      jdbcTemplate.execute("ALTER TABLE store_settings DROP COLUMN IF EXISTS facebook_url");
    } catch (Exception exception) {
      LOGGER.debug("Skipping legacy store_settings facebook_url cleanup", exception);
    }
  }

  private Review buildReview(String name, int rating, String comment, LocalDate reviewDate) {
    Review review = new Review();
    review.setName(name);
    review.setRating(rating);
    review.setComment(comment);
    review.setReviewDate(reviewDate);
    return review;
  }
}
