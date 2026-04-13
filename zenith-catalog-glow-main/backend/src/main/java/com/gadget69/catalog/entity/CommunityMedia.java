package com.gadget69.catalog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "community_media")
public class CommunityMedia {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String title;

  @Column(length = 1200)
  private String caption;

  @Column(name = "media_type", nullable = false)
  private String mediaType = "IMAGE";

  @Column(name = "image_url", length = 2000)
  private String imageUrl;

  @Column(name = "video_url", length = 2000)
  private String videoUrl;

  @Column(name = "thumbnail_url", length = 2000)
  private String thumbnailUrl;

  @Column(name = "video_public_id", length = 300)
  private String videoPublicId;

  @Column(name = "video_width")
  private Integer videoWidth;

  @Column(name = "video_height")
  private Integer videoHeight;

  @Column(name = "video_duration")
  private Double videoDuration;

  @Column(name = "action_link")
  private String actionLink;

  @Column(name = "display_order", nullable = false)
  private Integer displayOrder = 0;

  @Column(name = "is_active", nullable = false)
  private Boolean isActive = true;

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
