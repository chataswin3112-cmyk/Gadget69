package com.gadget69.catalog.repository;

import com.gadget69.catalog.entity.VariantMedia;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VariantMediaRepository extends JpaRepository<VariantMedia, Long> {

  List<VariantMedia> findByVariantIdOrderByDisplayOrderAscIdAsc(Long variantId);

  void deleteByVariantId(Long variantId);
}
