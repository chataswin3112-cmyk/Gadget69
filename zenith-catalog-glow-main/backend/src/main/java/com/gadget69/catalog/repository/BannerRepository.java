package com.gadget69.catalog.repository;

import com.gadget69.catalog.entity.Banner;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BannerRepository extends JpaRepository<Banner, Long> {
  List<Banner> findAllByOrderByDisplayOrderAscIdAsc();

  List<Banner> findAllByIsActiveTrueOrderByDisplayOrderAscIdAsc();
}
