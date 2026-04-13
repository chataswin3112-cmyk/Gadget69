package com.gadget69.catalog.entity;

import com.gadget69.catalog.config.StringListConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
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
@Table(name = "products")
public class Product {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(length = 4000)
  private String description;

  @Column(name = "short_description", length = 1000)
  private String shortDescription;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal price;

  @Column(name = "stock_quantity", nullable = false)
  private Integer stockQuantity = 0;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "section_id", nullable = false)
  private Section section;

  @Column(name = "image_url", length = 2000)
  private String imageUrl;

  @Column(name = "video_url", length = 2000)
  private String videoUrl;

  @Column(name = "gallery_images", columnDefinition = "CLOB")
  @Convert(converter = StringListConverter.class)
  private List<String> galleryImages = new ArrayList<>();

  @Column(name = "offer_flag", nullable = false)
  private Boolean offer = false;

  @Column(name = "offer_price", precision = 12, scale = 2)
  private BigDecimal offerPrice;

  @Column(precision = 12, scale = 2)
  private BigDecimal mrp;

  @Column(unique = true)
  private String slug;

  @Column(name = "model_number")
  private String modelNumber;

  @Column(name = "display_order", nullable = false)
  private Integer displayOrder = 0;

  @Column(name = "is_new_launch", nullable = false)
  private Boolean isNewLaunch = false;

  @Column(name = "is_best_seller", nullable = false)
  private Boolean isBestSeller = false;

  @Column(name = "is_featured", nullable = false)
  private Boolean isFeatured = false;

  @Column(name = "is_hero_featured", nullable = false)
  private Boolean isHeroFeatured = false;

  @Column(nullable = false)
  private String status = "ACTIVE";

  @Column(name = "default_thumbnail_url", length = 2000)
  private String defaultThumbnailUrl;

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
