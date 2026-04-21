package com.gadget69.catalog.repository;

import com.gadget69.catalog.entity.CustomerOrder;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
  List<CustomerOrder> findAllByOrderByCreatedAtDesc();

  List<CustomerOrder> findAllByIsDeletedFalseOrderByCreatedAtDesc();

  /**
   * Loads admin orders with optional filters.
   *
   * <p>PostgreSQL can fail to infer JDBC types for nullable JPQL predicates such as
   * {@code :fromDate is null or createdAt >= :fromDate}. To keep the query portable across H2 and
   * PostgreSQL, callers must always provide typed placeholder values and use the boolean filter
   * flags to enable or disable each predicate explicitly.
   *
   * @param orderStatuses must always be non-empty; ignored when {@code filterOrderStatuses} is false
   * @param paymentStatuses must always be non-empty; ignored when {@code filterPaymentStatuses} is false
   */
  @Query("""
      select distinct co
      from CustomerOrder co
      left join fetch co.items
      where co.isDeleted = false
        and (:filterOrderStatuses = false or co.orderStatus in :orderStatuses)
        and (:filterPaymentStatuses = false or co.paymentStatus in :paymentStatuses)
        and (:filterFromCreatedAt = false or co.createdAt >= :fromCreatedAt)
        and (:filterToCreatedAtExclusive = false or co.createdAt < :toCreatedAtExclusive)
      order by co.createdAt desc
      """)
  List<CustomerOrder> findAdminOrders(
      @Param("filterOrderStatuses") boolean filterOrderStatuses,
      @Param("orderStatuses") Set<String> orderStatuses,
      @Param("filterPaymentStatuses") boolean filterPaymentStatuses,
      @Param("paymentStatuses") Set<String> paymentStatuses,
      @Param("filterFromCreatedAt") boolean filterFromCreatedAt,
      @Param("fromCreatedAt") LocalDateTime fromCreatedAt,
      @Param("filterToCreatedAtExclusive") boolean filterToCreatedAtExclusive,
      @Param("toCreatedAtExclusive") LocalDateTime toCreatedAtExclusive);

  Optional<CustomerOrder> findByIdAndIsDeletedFalse(Long id);

  Optional<CustomerOrder> findByRazorpayOrderId(String razorpayOrderId);

  Optional<CustomerOrder> findByRazorpayPaymentId(String razorpayPaymentId);
}
