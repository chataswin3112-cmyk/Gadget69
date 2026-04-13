package com.gadget69.catalog.repository;

import com.gadget69.catalog.entity.CommunityMedia;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityMediaRepository extends JpaRepository<CommunityMedia, Long> {
  List<CommunityMedia> findAllByOrderByDisplayOrderAscIdAsc();

  List<CommunityMedia> findAllByIsActiveTrueOrderByDisplayOrderAscIdAsc();
}
