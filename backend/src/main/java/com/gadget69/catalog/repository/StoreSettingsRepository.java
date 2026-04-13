package com.gadget69.catalog.repository;

import com.gadget69.catalog.entity.StoreSettings;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreSettingsRepository extends JpaRepository<StoreSettings, Long> {
  Optional<StoreSettings> findTopByOrderByIdAsc();
}
