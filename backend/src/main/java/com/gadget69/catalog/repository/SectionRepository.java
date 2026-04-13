package com.gadget69.catalog.repository;

import com.gadget69.catalog.entity.Section;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SectionRepository extends JpaRepository<Section, Long> {
  List<Section> findAllByOrderBySortOrderAscNameAsc();
}
