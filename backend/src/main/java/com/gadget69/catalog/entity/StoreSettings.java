package com.gadget69.catalog.entity;

import com.gadget69.catalog.config.StringListConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "store_settings")
public class StoreSettings {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "site_title", nullable = false)
  private String siteTitle;

  @Column(name = "meta_description", length = 2000)
  private String metaDescription;

  @Column(name = "logo_url", length = 2000)
  private String logoUrl;

  @Column(name = "favicon_url", length = 2000)
  private String faviconUrl;

  @Column(name = "footer_text", length = 3000)
  private String footerText;

  @Column(name = "announcement_items", columnDefinition = "CLOB")
  @Convert(converter = StringListConverter.class)
  private List<String> announcementItems = new ArrayList<>();

  @Column(name = "instagram_url")
  private String instagramUrl;

  @Column(name = "facebook_url")
  private String facebookUrl;

  @Column(name = "whatsapp_number")
  private String whatsappNumber;

  @Column(name = "catalogue_url", length = 2000)
  private String catalogueUrl;

  @Column(name = "contact_url")
  private String contactUrl;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @PrePersist
  void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = createdAt;
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = LocalDateTime.now();
  }
}
