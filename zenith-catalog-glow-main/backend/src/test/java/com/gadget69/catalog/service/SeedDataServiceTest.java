package com.gadget69.catalog.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;

import com.gadget69.catalog.entity.AdminUser;
import com.gadget69.catalog.entity.Product;
import com.gadget69.catalog.entity.Section;
import com.gadget69.catalog.entity.StoreSettings;
import com.gadget69.catalog.repository.AdminUserRepository;
import com.gadget69.catalog.repository.ProductRepository;
import com.gadget69.catalog.repository.SectionRepository;
import com.gadget69.catalog.repository.StoreSettingsRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:seed-data-service;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.mail.enabled=false",
    "app.razorpay.enabled=false"
})
class SeedDataServiceTest {

  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  @Autowired
  private AdminUserRepository adminUserRepository;

  @Autowired
  private SeedDataService seedDataService;

  @Autowired
  private SectionRepository sectionRepository;

  @Autowired
  private ProductRepository productRepository;

  @Autowired
  private StoreSettingsRepository storeSettingsRepository;

  @MockBean
  private CatalogSyncService catalogSyncService;

  @Test
  void preservesAnExistingAdminPasswordOnSubsequentRuns() throws Exception {
    AdminUser adminUser = adminUserRepository.findByEmailIgnoreCase("admin@gadget69.com").orElseThrow();
    adminUser.setPasswordHash(passwordEncoder.encode("Custom@123"));
    adminUserRepository.save(adminUser);

    clearInvocations(catalogSyncService);
    seedDataService.run(new DefaultApplicationArguments(new String[0]));

    AdminUser reloaded = adminUserRepository.findByEmailIgnoreCase("admin@gadget69.com").orElseThrow();
    assertThat(passwordEncoder.matches("Custom@123", reloaded.getPasswordHash())).isTrue();
    assertThat(passwordEncoder.matches("Admin@123", reloaded.getPasswordHash())).isFalse();
  }

  @Test
  void backfillsCommunityMediaWhenCatalogAlreadyExists() throws Exception {
    Section section = new Section();
    section.setName("Existing Section");
    section.setDescription("Existing seeded section");
    section.setImageUrl("https://example.com/section.jpg");
    sectionRepository.save(section);

    Product product = new Product();
    product.setName("Existing Product");
    product.setDescription("Existing seeded product");
    product.setPrice(new BigDecimal("1999.00"));
    product.setMrp(new BigDecimal("2499.00"));
    product.setStockQuantity(5);
    product.setSection(section);
    product.setImageUrl("https://example.com/product.jpg");
    product.setGalleryImages(List.of());
    product.setSlug("existing-product");
    product.setDisplayOrder(0);
    productRepository.save(product);

    clearInvocations(catalogSyncService);
    seedDataService.run(new DefaultApplicationArguments(new String[0]));

    verify(catalogSyncService).seedMissingCommunityMedia();
  }

  @Test
  void backfillsLegacyContactLinksInExistingStoreSettings() throws Exception {
    StoreSettings settings = storeSettingsRepository.findTopByOrderByIdAsc().orElseThrow();
    settings.setInstagramUrl("https://instagram.com");
    settings.setWhatsappNumber("919876543210");
    settings.setShopPhone("9361586278");
    storeSettingsRepository.save(settings);

    seedDataService.run(new DefaultApplicationArguments(new String[0]));

    StoreSettings reloaded = storeSettingsRepository.findTopByOrderByIdAsc().orElseThrow();
    assertThat(reloaded.getInstagramUrl()).isEqualTo("https://www.instagram.com/gadget69_tuty/");
    assertThat(reloaded.getWhatsappNumber()).isEqualTo("919361586278");
    assertThat(reloaded.getShopPhone()).isEqualTo("9361586278");
  }
}
