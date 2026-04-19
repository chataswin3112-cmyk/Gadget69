package com.gadget69.catalog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "variant_media")
public class VariantMedia {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "variant_id", nullable = false)
  private ProductVariant variant;

  @Column(name = "media_url", nullable = false, length = 2000)
  private String mediaUrl;

  /**
   * Media type: IMAGE or VIDEO.
   * Only one VIDEO is recommended per variant but multiple are allowed.
   */
  @Column(name = "media_type", nullable = false, length = 10)
  private String mediaType = "IMAGE";

  @Column(name = "display_order", nullable = false)
  private Integer displayOrder = 0;

  @Column(name = "is_primary", nullable = false)
  private Boolean isPrimary = false;
}
