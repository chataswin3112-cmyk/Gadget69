package com.gadget69.catalog.repository;

import com.gadget69.catalog.entity.CustomerOrder;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
  List<CustomerOrder> findAllByOrderByCreatedAtDesc();

  List<CustomerOrder> findAllByIsDeletedFalseOrderByCreatedAtDesc();

  @EntityGraph(attributePaths = "items")
  @Query("""
      select distinct customerOrder
      from CustomerOrder customerOrder
      left join fetch customerOrder.items
      where customerOrder.isDeleted = false
        and (:filterOrderStatuses = false or customerOrder.orderStatus in :orderStatuses)
        and (:filterPaymentStatuses = false or customerOrder.paymentStatus in :paymentStatuses)
        and (:fromCreatedAt is null or customerOrder.createdAt >= :fromCreatedAt)
        and (:toCreatedAtExclusive is null or customerOrder.createdAt < :toCreatedAtExclusive)
      order by customerOrder.createdAt desc
      """)
  List<CustomerOrder> findAdminOrders(
      @Param("orderStatuses") Set<String> orderStatuses,
      @Param("filterOrderStatuses") boolean filterOrderStatuses,
      @Param("paymentStatuses") Set<String> paymentStatuses,
      @Param("filterPaymentStatuses") boolean filterPaymentStatuses,
      @Param("fromCreatedAt") LocalDateTime fromCreatedAt,
      @Param("toCreatedAtExclusive") LocalDateTime toCreatedAtExclusive);

  Optional<CustomerOrder> findByIdAndIsDeletedFalse(Long id);

  Optional<CustomerOrder> findByRazorpayOrderId(String razorpayOrderId);

  Optional<CustomerOrder> findByRazorpayPaymentId(String razorpayPaymentId);
}
