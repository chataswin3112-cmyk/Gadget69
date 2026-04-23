package com.gadget69.catalog.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gadget69.catalog.entity.CommunityMedia;
import com.gadget69.catalog.repository.BannerRepository;
import com.gadget69.catalog.repository.CommunityMediaRepository;
import com.gadget69.catalog.repository.ProductRepository;
import com.gadget69.catalog.repository.SectionRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CatalogSyncServiceTest {

  @Mock
  private SectionRepository sectionRepository;

  @Mock
  private ProductRepository productRepository;

  @Mock
  private BannerRepository bannerRepository;

  @Mock
  private CommunityMediaRepository communityMediaRepository;

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void seedMissingCommunityMediaSeedsDefaultsFromLiveCatalogWhenRepositoryIsEmpty() {
    when(communityMediaRepository.count()).thenReturn(0L);

    CatalogSyncService service = new CatalogSyncService(
        objectMapper,
        sectionRepository,
        productRepository,
        bannerRepository,
        communityMediaRepository);

    int seededCount = service.seedMissingCommunityMedia();

    ArgumentCaptor<List<CommunityMedia>> mediaCaptor = ArgumentCaptor.forClass(List.class);
    verify(communityMediaRepository).saveAll(mediaCaptor.capture());

    List<CommunityMedia> savedItems = mediaCaptor.getValue();
    assertThat(seededCount).isEqualTo(savedItems.size());
    assertThat(savedItems).hasSizeGreaterThanOrEqualTo(3);
    assertThat(savedItems)
        .extracting(CommunityMedia::getTitle)
        .contains("Desk Setup Drop", "Travel Tech Pick", "Creator Essentials");
    assertThat(savedItems)
        .allMatch(item -> Boolean.TRUE.equals(item.getIsActive()))
        .allMatch(item -> "IMAGE".equals(item.getMediaType()));
  }

  @Test
  void seedMissingCommunityMediaDoesNotOverwriteExistingItems() {
    when(communityMediaRepository.count()).thenReturn(2L);

    CatalogSyncService service = new CatalogSyncService(
        objectMapper,
        sectionRepository,
        productRepository,
        bannerRepository,
        communityMediaRepository);

    int existingCount = service.seedMissingCommunityMedia();

    assertThat(existingCount).isEqualTo(2);
    verify(communityMediaRepository, never()).saveAll(anyList());
  }
}
