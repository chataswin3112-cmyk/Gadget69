package com.gadget69.catalog.repository;

import com.gadget69.catalog.entity.Section;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SectionRepository extends JpaRepository<Section, Long> {
  @EntityGraph(attributePaths = "parentSection")
  List<Section> findAllByOrderBySortOrderAscNameAsc();

  @Override
  @EntityGraph(attributePaths = "parentSection")
  Optional<Section> findById(Long id);

  long countByParentSection_Id(Long parentSectionId);
}
