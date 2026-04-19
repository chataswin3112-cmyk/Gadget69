package com.gadget69.catalog.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
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
@Table(name = "product_variants")
public class ProductVariant {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "product_id", nullable = false)
  private Product product;

  @Column(name = "color_name", nullable = false)
  private String colorName;

  @Column(name = "hex_code", length = 10)
  private String hexCode = "#000000";

  /** Optional — for apparel, accessories with size variants (S/M/L/XL, 7/8/9 etc.) */
  @Column(length = 50)
  private String size;

  /** The variant's own selling price. If null, falls back to product base price. */
  @Column(precision = 12, scale = 2)
  private BigDecimal price;

  /** Relative price adjustment from product base price (legacy, prefer price field). */
  @Column(name = "price_adjustment", nullable = false)
  private Integer priceAdjustment = 0;

  @Column(nullable = false)
  private Integer stock = 0;

  @Column(length = 100)
  private String sku;

  @Column(name = "is_default", nullable = false)
  private Boolean isDefault = false;

  @Column(name = "display_order", nullable = false)
  private Integer displayOrder = 0;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @OrderBy("displayOrder ASC, id ASC")
  private List<VariantMedia> media = new ArrayList<>();

  @PrePersist
  void onCreate() {
    createdAt = LocalDateTime.now();
  }
}
