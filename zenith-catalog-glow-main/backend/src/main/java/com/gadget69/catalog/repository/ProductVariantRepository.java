package com.gadget69.catalog.repository;

import com.gadget69.catalog.entity.ProductVariant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

  @EntityGraph(attributePaths = {"product", "media"})
  List<ProductVariant> findByProductIdOrderByDisplayOrderAscIdAsc(Long productId);

  @Override
  @EntityGraph(attributePaths = {"product", "media"})
  Optional<ProductVariant> findById(Long id);

  void deleteByProductId(Long productId);

  boolean existsByProductId(Long productId);
}
