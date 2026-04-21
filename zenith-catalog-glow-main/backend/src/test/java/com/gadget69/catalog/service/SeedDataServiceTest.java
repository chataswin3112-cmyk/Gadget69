package com.gadget69.catalog.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.gadget69.catalog.entity.AdminUser;
import com.gadget69.catalog.repository.AdminUserRepository;
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

  @MockBean
  private CatalogSyncService catalogSyncService;

  @Test
  void preservesAnExistingAdminPasswordOnSubsequentRuns() throws Exception {
    AdminUser adminUser = adminUserRepository.findByEmailIgnoreCase("admin@gadget69.com").orElseThrow();
    adminUser.setPasswordHash(passwordEncoder.encode("Custom@123"));
    adminUserRepository.save(adminUser);

    seedDataService.run(new DefaultApplicationArguments(new String[0]));

    AdminUser reloaded = adminUserRepository.findByEmailIgnoreCase("admin@gadget69.com").orElseThrow();
    assertThat(passwordEncoder.matches("Custom@123", reloaded.getPasswordHash())).isTrue();
    assertThat(passwordEncoder.matches("Admin@123", reloaded.getPasswordHash())).isFalse();
  }
}
