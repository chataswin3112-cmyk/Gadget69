package com.gadget69.catalog.repository;

import com.gadget69.catalog.entity.Product;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
  @EntityGraph(attributePaths = {"section", "section.parentSection"})
  List<Product> findAllByOrderByDisplayOrderAscCreatedAtDescIdAsc();

  @EntityGraph(attributePaths = {"section", "section.parentSection"})
  List<Product> findAllByStatusIgnoreCaseOrderByDisplayOrderAscCreatedAtDescIdAsc(String status);

  @Override
  @EntityGraph(attributePaths = {"section", "section.parentSection"})
  Optional<Product> findById(Long id);

  @EntityGraph(attributePaths = {"section", "section.parentSection"})
  Optional<Product> findByIdAndStatusIgnoreCase(Long id, String status);

  long countBySection_Id(Long sectionId);
}
