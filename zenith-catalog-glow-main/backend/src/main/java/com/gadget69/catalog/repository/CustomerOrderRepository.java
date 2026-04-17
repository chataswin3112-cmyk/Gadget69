package com.gadget69.catalog.repository;

import com.gadget69.catalog.entity.CustomerOrder;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
  List<CustomerOrder> findAllByOrderByCreatedAtDesc();

  Optional<CustomerOrder> findByRazorpayOrderId(String razorpayOrderId);

  Optional<CustomerOrder> findByRazorpayPaymentId(String razorpayPaymentId);
}
