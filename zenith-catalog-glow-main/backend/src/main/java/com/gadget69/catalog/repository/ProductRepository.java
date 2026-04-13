package com.gadget69.catalog.repository;

import com.gadget69.catalog.entity.Product;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
  @EntityGraph(attributePaths = "section")
  List<Product> findAllByOrderByDisplayOrderAscCreatedAtDesc();

  @Override
  @EntityGraph(attributePaths = "section")
  Optional<Product> findById(Long id);

  long countBySection_Id(Long sectionId);
}
