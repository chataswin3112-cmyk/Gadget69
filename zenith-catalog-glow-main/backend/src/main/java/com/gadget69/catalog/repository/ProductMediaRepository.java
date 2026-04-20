package com.gadget69.catalog.repository;

import com.gadget69.catalog.entity.ProductMedia;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductMediaRepository extends JpaRepository<ProductMedia, Long> {

  List<ProductMedia> findByProductIdOrderByDisplayOrderAscIdAsc(Long productId);

  void deleteByProductId(Long productId);
}
