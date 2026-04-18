package com.gadget69.catalog.repository;

import com.gadget69.catalog.entity.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {
  List<Review> findAllByOrderByReviewDateDescIdDesc();
}
