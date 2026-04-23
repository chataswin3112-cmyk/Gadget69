package com.gadget69.catalog.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.gadget69.catalog.entity.CustomerOrder;
import com.gadget69.catalog.entity.OrderItem;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.jdbc.core.JdbcTemplate;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class CustomerOrderRepositoryTest {

  private static final Set<String> DISABLED_ORDER_STATUS_FILTER =
      Set.of("__NO_ORDER_STATUS_FILTER__");
  private static final Set<String> DISABLED_PAYMENT_STATUS_FILTER =
      Set.of("__NO_PAYMENT_STATUS_FILTER__");
  private static final LocalDateTime DISABLED_DATE_FILTER =
      LocalDateTime.of(1970, 1, 1, 0, 0);

  @Autowired
  private CustomerOrderRepository customerOrderRepository;

  @Autowired
  private TestEntityManager entityManager;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  private int orderSequence;

  @BeforeEach
  void setUp() {
    orderSequence = 1;
  }

  @Test
  void findAdminOrdersReturnsDistinctNonDeletedOrdersNewestFirstWhenFiltersDisabled() {
    CustomerOrder olderOrder = persistOrder(
        "Older Order",
        "CONFIRMED",
        "SUCCESS",
        LocalDateTime.of(2026, 5, 10, 9, 0),
        false,
        "order-older",
        "payment-older",
        "Pulse Speaker");

    CustomerOrder newestOrder = persistOrder(
        "Newest Order",
        "SHIPPED",
        "PENDING",
        LocalDateTime.of(2026, 5, 12, 11, 30),
        false,
        "order-newest",
        "payment-newest",
        "Atlas Pro",
        "Pulse Buds");

    persistOrder(
        "Archived Order",
        "CONFIRMED",
        "SUCCESS",
        LocalDateTime.of(2026, 5, 13, 8, 0),
        true,
        "order-archived",
        "payment-archived",
        "Hidden Phone");

    List<CustomerOrder> orders = customerOrderRepository.findAdminOrders(
        false,
        DISABLED_ORDER_STATUS_FILTER,
        false,
        DISABLED_PAYMENT_STATUS_FILTER,
        false,
        DISABLED_DATE_FILTER,
        false,
        DISABLED_DATE_FILTER);

    assertThat(orders)
        .extracting(CustomerOrder::getId)
        .containsExactly(newestOrder.getId(), olderOrder.getId());
    assertThat(orders.get(0).getItems())
        .extracting(OrderItem::getProductName)
        .containsExactly("Atlas Pro", "Pulse Buds");
    assertThat(orders)
        .filteredOn(order -> order.getId().equals(newestOrder.getId()))
        .hasSize(1);
  }

  @Test
  void findAdminOrdersAppliesOrderPaymentAndDateFilters() {
    CustomerOrder fromBoundary = persistOrder(
        "From Boundary",
        "CONFIRMED",
        "SUCCESS",
        LocalDateTime.of(2026, 5, 1, 0, 0),
        false,
        "order-from",
        "payment-from",
        "Atlas Pro");

    CustomerOrder insideRange = persistOrder(
        "Inside Range",
        "CONFIRMED",
        "SUCCESS",
        LocalDateTime.of(2026, 5, 20, 14, 15),
        false,
        "order-inside",
        "payment-inside",
        "Pulse Speaker");

    persistOrder(
        "To Boundary",
        "CONFIRMED",
        "SUCCESS",
        LocalDateTime.of(2026, 6, 1, 0, 0),
        false,
        "order-boundary",
        "payment-boundary",
        "Boundary Tablet");

    persistOrder(
        "Wrong Order Status",
        "CANCELLED",
        "SUCCESS",
        LocalDateTime.of(2026, 5, 18, 9, 45),
        false,
        "order-wrong-status",
        "payment-wrong-status",
        "Cancelled Phone");

    persistOrder(
        "Wrong Payment Status",
        "CONFIRMED",
        "FAILED",
        LocalDateTime.of(2026, 5, 18, 9, 50),
        false,
        "order-wrong-payment",
        "payment-wrong-payment",
        "Failed Phone");

    persistOrder(
        "Archived Match",
        "CONFIRMED",
        "SUCCESS",
        LocalDateTime.of(2026, 5, 21, 10, 0),
        true,
        "order-archived-match",
        "payment-archived-match",
        "Archived Match Phone");

    List<CustomerOrder> orders = customerOrderRepository.findAdminOrders(
        true,
        Set.of("CONFIRMED"),
        true,
        Set.of("SUCCESS"),
        true,
        LocalDateTime.of(2026, 5, 1, 0, 0),
        true,
        LocalDateTime.of(2026, 6, 1, 0, 0));

    assertThat(orders)
        .extracting(CustomerOrder::getId)
        .containsExactly(insideRange.getId(), fromBoundary.getId());
  }

  @Test
  void findByIdAndIsDeletedFalseHidesArchivedOrders() {
    CustomerOrder activeOrder = persistOrder(
        "Active Order",
        "PENDING",
        "PENDING",
        LocalDateTime.of(2026, 5, 8, 12, 0),
        false,
        "order-active",
        "payment-active",
        "Atlas Pro");

    CustomerOrder archivedOrder = persistOrder(
        "Archived Order",
        "PENDING",
        "PENDING",
        LocalDateTime.of(2026, 5, 8, 12, 30),
        true,
        "order-archived",
        "payment-archived",
        "Pulse Speaker");

    assertThat(customerOrderRepository.findByIdAndIsDeletedFalse(activeOrder.getId()))
        .isPresent()
        .get()
        .extracting(CustomerOrder::getCustomerName)
        .isEqualTo("Active Order");
    assertThat(customerOrderRepository.findByIdAndIsDeletedFalse(archivedOrder.getId())).isEmpty();
  }

  @Test
  void findsOrdersByRazorpayIdentifiers() {
    CustomerOrder order = persistOrder(
        "Razorpay Match",
        "CONFIRMED",
        "SUCCESS",
        LocalDateTime.of(2026, 5, 15, 16, 45),
        false,
        "rzp-order-123",
        "rzp-payment-456",
        "Atlas Pro");

    assertThat(customerOrderRepository.findByRazorpayOrderId("rzp-order-123"))
        .isPresent()
        .get()
        .extracting(CustomerOrder::getId)
        .isEqualTo(order.getId());
    assertThat(customerOrderRepository.findByRazorpayPaymentId("rzp-payment-456"))
        .isPresent()
        .get()
        .extracting(CustomerOrder::getId)
        .isEqualTo(order.getId());
  }

  private CustomerOrder persistOrder(
      String customerName,
      String orderStatus,
      String paymentStatus,
      LocalDateTime createdAt,
      boolean deleted,
      String razorpayOrderId,
      String razorpayPaymentId,
      String... productNames) {
    int suffix = orderSequence++;

    CustomerOrder order = new CustomerOrder();
    order.setCustomerName(customerName);
    order.setPhone(String.format("900000%04d", suffix));
    order.setEmail("customer" + suffix + "@example.com");
    order.setAddress("12 Test Street, Chennai");
    order.setPincode("600001");
    order.setTotalAmount(BigDecimal.valueOf(productNames.length * 1000L));
    order.setAmountPaise(productNames.length * 100000);
    order.setPaymentStatus(paymentStatus);
    order.setOrderStatus(orderStatus);
    order.setDeleted(deleted);
    order.setRazorpayOrderId(razorpayOrderId);
    order.setRazorpayPaymentId(razorpayPaymentId);

    for (int index = 0; index < productNames.length; index++) {
      OrderItem item = new OrderItem();
      item.setOrder(order);
      item.setProductId((long) (suffix * 10 + index + 1));
      item.setProductName(productNames[index]);
      item.setQuantity(1);
      item.setPrice(BigDecimal.valueOf(1000L));
      if (index == 0) {
        item.setVariantColor("Blue");
        item.setVariantSize("128 GB");
      }
      order.getItems().add(item);
    }

    entityManager.persist(order);
    entityManager.flush();

    jdbcTemplate.update(
        "update customer_orders set created_at = ?, updated_at = ? where id = ?",
        Timestamp.valueOf(createdAt),
        Timestamp.valueOf(createdAt.plusMinutes(5)),
        order.getId());

    entityManager.clear();
    return order;
  }
}
