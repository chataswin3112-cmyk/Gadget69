package com.gadget69.catalog.repository;

import com.gadget69.catalog.entity.Product;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
  List<Product> findAllByOrderByDisplayOrderAscCreatedAtDesc();

  long countBySection_Id(Long sectionId);
}
