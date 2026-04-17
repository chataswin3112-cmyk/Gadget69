package com.gadget69.catalog.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gadget69.catalog.entity.Banner;
import com.gadget69.catalog.entity.Product;
import com.gadget69.catalog.entity.Section;
import com.gadget69.catalog.repository.BannerRepository;
import com.gadget69.catalog.repository.CommunityMediaRepository;
import com.gadget69.catalog.repository.ProductRepository;
import com.gadget69.catalog.repository.SectionRepository;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CatalogSyncService {

  private static final String CATALOG_RESOURCE = "catalog/live-catalog.json";
  private static final List<String> HERO_PRODUCT_SLUGS = List.of(
      "ultra-series-9-smartwatch-amoled-display",
      "magsafe-magnetic-power-bank-10000mah",
      "1tb-portable-nvme-ssd-high-speed"
  );

  private final ObjectMapper objectMapper;
  private final SectionRepository sectionRepository;
  private final ProductRepository productRepository;
  private final BannerRepository bannerRepository;
  private final CommunityMediaRepository communityMediaRepository;

  @Transactional
  public CatalogSyncResult replaceDemoData() {
    CatalogDefinition catalog = loadCatalog();
    return syncCatalog(catalog, true);
  }

  @Transactional
  public CatalogSyncResult seedFreshCatalog() {
    CatalogDefinition catalog = loadCatalog();
    return syncCatalog(catalog, false);
  }

  private CatalogSyncResult syncCatalog(CatalogDefinition catalog, boolean removeNonCatalogContent) {
    Map<String, CatalogSection> sectionDefinitions = catalog.sections().stream()
        .collect(Collectors.toMap(
            section -> normalizedKey(section.name()),
            Function.identity(),
            (left, right) -> right,
            LinkedHashMap::new));
    Set<String> sectionNames = sectionDefinitions.keySet();

    Map<String, CatalogProduct> productDefinitions = catalog.products().stream()
        .collect(Collectors.toMap(
            CatalogProduct::slug,
            Function.identity(),
            (left, right) -> right,
            LinkedHashMap::new));
    Set<String> productSlugs = productDefinitions.keySet();

    Map<String, Section> sectionsByName = sectionRepository.findAll().stream()
        .collect(Collectors.toMap(
            section -> normalizedKey(section.getName()),
            Function.identity(),
            (left, right) -> left,
            LinkedHashMap::new));

    int createdSections = 0;
    int updatedSections = 0;
    List<Section> sectionsToSave = new ArrayList<>();
    for (CatalogSection sectionDefinition : sectionDefinitions.values()) {
      String sectionKey = normalizedKey(sectionDefinition.name());
      Section section = sectionsByName.get(sectionKey);
      if (section == null) {
        section = new Section();
        sectionsByName.put(sectionKey, section);
        createdSections++;
      } else {
        updatedSections++;
      }
      applySection(section, sectionDefinition);
      sectionsToSave.add(section);
    }
    sectionRepository.saveAll(sectionsToSave);

    Map<String, Section> savedSectionsByName = sectionRepository.findAll().stream()
        .collect(Collectors.toMap(
            section -> normalizedKey(section.getName()),
            Function.identity(),
            (left, right) -> left,
            LinkedHashMap::new));

    Map<String, Product> productsBySlug = productRepository.findAll().stream()
        .filter(product -> product.getSlug() != null && !product.getSlug().isBlank())
        .collect(Collectors.toMap(
            Product::getSlug,
            Function.identity(),
            (left, right) -> left,
            LinkedHashMap::new));

    int createdProducts = 0;
    int updatedProducts = 0;
    List<Product> productsToSave = new ArrayList<>();
    for (CatalogProduct productDefinition : productDefinitions.values()) {
      Product product = productsBySlug.get(productDefinition.slug());
      if (product == null) {
        product = new Product();
        productsBySlug.put(productDefinition.slug(), product);
        createdProducts++;
      } else {
        updatedProducts++;
      }
      Section section = savedSectionsByName.get(normalizedKey(productDefinition.category()));
      if (section == null) {
        throw new ResponseStatusException(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Catalog references an unknown category: " + productDefinition.category());
      }
      applyProduct(product, productDefinition, section);
      productsToSave.add(product);
    }
    productRepository.saveAll(productsToSave);

    int deletedProducts = 0;
    int deletedSections = 0;
    int deletedBanners = 0;
    int deletedCommunityMedia = 0;
    if (removeNonCatalogContent) {
      List<Product> productsToDelete = productRepository.findAll().stream()
          .filter(product -> product.getSlug() == null || !productSlugs.contains(product.getSlug()))
          .toList();
      deletedProducts = productsToDelete.size();
      productRepository.deleteAll(productsToDelete);

      List<Section> sectionsToDelete = sectionRepository.findAll().stream()
          .filter(section -> !sectionNames.contains(normalizedKey(section.getName())))
          .filter(section -> productRepository.countBySection_Id(section.getId()) == 0)
          .toList();
      deletedSections = sectionsToDelete.size();
      sectionRepository.deleteAll(sectionsToDelete);

      deletedBanners = (int) bannerRepository.count();
      bannerRepository.deleteAll();
      deletedCommunityMedia = (int) communityMediaRepository.count();
      communityMediaRepository.deleteAll();
    } else if (bannerRepository.count() == 0) {
      deletedBanners = 0;
    }

    int bannerCount = resetHeroBanners();

    return new CatalogSyncResult(
        createdSections,
        updatedSections,
        deletedSections,
        createdProducts,
        updatedProducts,
        deletedProducts,
        deletedBanners,
        deletedCommunityMedia,
        bannerCount,
        sectionRepository.count(),
        productRepository.count()
    );
  }

  private CatalogDefinition loadCatalog() {
    try (InputStream inputStream = new ClassPathResource(CATALOG_RESOURCE).getInputStream()) {
      return objectMapper.readValue(inputStream, CatalogDefinition.class);
    } catch (IOException ex) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to load live catalog", ex);
    }
  }

  private int resetHeroBanners() {
    bannerRepository.deleteAll();
    Map<String, Product> productsBySlug = productRepository.findAll().stream()
        .filter(product -> product.getSlug() != null)
        .collect(Collectors.toMap(Product::getSlug, Function.identity(), (left, right) -> left));

    List<Banner> banners = new ArrayList<>();
    for (int index = 0; index < HERO_PRODUCT_SLUGS.size(); index++) {
      Product product = productsBySlug.get(HERO_PRODUCT_SLUGS.get(index));
      if (product == null) {
        continue;
      }
      Banner banner = new Banner();
      banner.setTitle(product.getName());
      banner.setDesktopImageUrl(product.getImageUrl());
      banner.setMobileImageUrl(product.getImageUrl());
      banner.setCtaText("Shop Now");
      banner.setCtaLink("/products/" + product.getId());
      banner.setLinkedProductId(product.getId());
      banner.setDisplayOrder(index);
      banner.setIsActive(true);
      banners.add(banner);
    }
    bannerRepository.saveAll(banners);
    return banners.size();
  }

  private void applySection(Section section, CatalogSection sectionDefinition) {
    section.setName(sectionDefinition.name());
    section.setDescription(sectionDefinition.description());
    section.setImageUrl(sectionDefinition.imageUrl());
    section.setIsActive(true);
    section.setShowInExplore(true);
    section.setShowInTopCategory(sectionDefinition.sortOrder() < 6);
    section.setAccentTone(null);
    section.setSortOrder(sectionDefinition.sortOrder());
  }

  private void applyProduct(Product product, CatalogProduct productDefinition, Section section) {
    product.setName(productDefinition.name());
    product.setDescription(productDefinition.description());
    product.setShortDescription(productDefinition.shortDescription());
    product.setPrice(new BigDecimal(productDefinition.price()));
    product.setMrp(new BigDecimal(productDefinition.mrp()));
    product.setStockQuantity(productDefinition.stockQuantity());
    product.setSection(section);
    product.setImageUrl(productDefinition.imageUrl());
    product.setDefaultThumbnailUrl(productDefinition.imageUrl());
    product.setGalleryImages(productDefinition.galleryImages() == null
        ? List.of()
        : productDefinition.galleryImages());
    product.setVideoUrl(null);
    product.setOffer(false);
    product.setOfferPrice(null);
    product.setOfferStartDate(null);
    product.setOfferEndDate(null);
    product.setSlug(productDefinition.slug());
    product.setModelNumber(productDefinition.modelNumber());
    product.setDisplayOrder(productDefinition.displayOrder());
    product.setIsNewLaunch(false);
    product.setIsBestSeller(false);
    product.setIsFeatured(productDefinition.displayOrder() < 6);
    product.setIsHeroFeatured(HERO_PRODUCT_SLUGS.contains(productDefinition.slug()));
    product.setStatus("ACTIVE");
  }

  private String normalizedKey(String value) {
    return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
  }

  public record CatalogSyncResult(
      int createdSections,
      int updatedSections,
      int deletedSections,
      int createdProducts,
      int updatedProducts,
      int deletedProducts,
      int deletedBanners,
      int deletedCommunityMedia,
      int heroBanners,
      long totalSections,
      long totalProducts
  ) {}

  public record CatalogDefinition(List<CatalogSection> sections, List<CatalogProduct> products) {}

  public record CatalogSection(
      String name,
      String description,
      String imageUrl,
      int sortOrder
  ) {}

  public record CatalogProduct(
      String name,
      String category,
      String price,
      String mrp,
      int stockQuantity,
      String slug,
      String modelNumber,
      String shortDescription,
      String description,
      String imageUrl,
      List<String> galleryImages,
      int displayOrder
  ) {}
}
