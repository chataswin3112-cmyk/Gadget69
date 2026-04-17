package com.gadget69.catalog.service;

import com.gadget69.catalog.entity.AdminUser;
import com.gadget69.catalog.entity.Product;
import com.gadget69.catalog.entity.StoreSettings;
import com.gadget69.catalog.repository.AdminUserRepository;
import com.gadget69.catalog.repository.ProductRepository;
import com.gadget69.catalog.repository.SectionRepository;
import com.gadget69.catalog.repository.StoreSettingsRepository;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SeedDataService implements ApplicationRunner {

  private static final long DEFAULT_OFFER_LOOKBACK_DAYS = 1;
  private static final long DEFAULT_OFFER_DURATION_DAYS = 30;

  private final AdminUserRepository adminUserRepository;
  private final SectionRepository sectionRepository;
  private final ProductRepository productRepository;
  private final StoreSettingsRepository storeSettingsRepository;
  private final AuthTokenService authTokenService;
  private final CatalogSyncService catalogSyncService;

  @Override
  public void run(ApplicationArguments args) {
    seedAdmin();
    seedCatalog();
    seedSettings();
    backfillLegacyOfferSchedules();
  }

  private void seedAdmin() {
    if (adminUserRepository.count() > 0) {
      return;
    }

    AdminUser adminUser = new AdminUser();
    adminUser.setName("Gadget69 Admin");
    adminUser.setEmail("admin@gadget69.com");
    adminUser.setPasswordHash(authTokenService.encodePassword("Admin@123"));
    adminUser.setTokenVersion(0);
    adminUserRepository.save(adminUser);
    System.out.println("""
        DEFAULT ADMIN CREDENTIALS CREATED
        Email: admin@gadget69.com
        Password: Admin@123
        Change this password immediately after first login.
        """);
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
    settings.setFacebookUrl("https://facebook.com");
    settings.setWhatsappNumber("919876543210");
    settings.setCatalogueUrl("#");
    settings.setContactUrl("/contact");
    storeSettingsRepository.save(settings);
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
}
