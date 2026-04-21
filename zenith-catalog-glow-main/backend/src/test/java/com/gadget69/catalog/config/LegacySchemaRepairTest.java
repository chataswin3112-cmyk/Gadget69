package com.gadget69.catalog.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

class LegacySchemaRepairTest {

  private JdbcTemplate jdbcTemplate;

  @BeforeEach
  void setUp() {
    DriverManagerDataSource dataSource = new DriverManagerDataSource();
    dataSource.setDriverClassName("org.h2.Driver");
    dataSource.setUrl("jdbc:h2:mem:legacy-schema-repair;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1");
    dataSource.setUsername("sa");
    dataSource.setPassword("");
    jdbcTemplate = new JdbcTemplate(dataSource);
    jdbcTemplate.execute("DROP ALL OBJECTS");
  }

  @Test
  void repairsLegacyAdminUsersAndOrderColumnsBeforeJpaNeedsThem() throws Exception {
    jdbcTemplate.execute("""
        CREATE TABLE admin_users (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          password_hash VARCHAR(500) NOT NULL,
          created_at TIMESTAMP NOT NULL
        )
        """);
    jdbcTemplate.update("""
        INSERT INTO admin_users (name, email, password_hash, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        """, "Admin", "admin@gadget69.com", "hash");

    jdbcTemplate.execute("""
        CREATE TABLE customer_orders (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          phone VARCHAR(255),
          address VARCHAR(3000) NOT NULL,
          pincode VARCHAR(255) NOT NULL,
          total_amount DECIMAL(12, 2) NOT NULL,
          created_at TIMESTAMP NOT NULL
        )
        """);
    jdbcTemplate.update("""
        INSERT INTO customer_orders (customer_name, phone, address, pincode, total_amount, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, "Riya", "9876543210", "88 Lake Road", "560001", 1499.00);

    jdbcTemplate.execute("""
        CREATE TABLE order_items (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          order_id BIGINT NOT NULL,
          product_id BIGINT,
          product_name VARCHAR(255) NOT NULL,
          quantity INTEGER NOT NULL,
          price DECIMAL(12, 2) NOT NULL
        )
        """);
    jdbcTemplate.update("""
        INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
        VALUES (?, ?, ?, ?, ?)
        """, 1L, 9L, "Legacy Earbuds", 2, 749.50);

    LegacySchemaRepair legacySchemaRepair = new LegacySchemaRepair(jdbcTemplate);
    legacySchemaRepair.afterPropertiesSet();

    Integer tokenVersion = jdbcTemplate.queryForObject(
        "SELECT token_version FROM admin_users WHERE email = ?",
        Integer.class,
        "admin@gadget69.com");
    assertThat(tokenVersion).isEqualTo(0);

    String customerPhone = jdbcTemplate.queryForObject(
        "SELECT customer_phone FROM customer_orders WHERE customer_name = ?",
        String.class,
        "Riya");
    assertThat(customerPhone).isEqualTo("9876543210");

    Integer emailColumnCount = jdbcTemplate.queryForObject(
        """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE UPPER(table_name) = 'CUSTOMER_ORDERS'
              AND UPPER(column_name) = 'EMAIL'
            """,
        Integer.class);
    assertThat(emailColumnCount).isEqualTo(1);

    String paymentStatus = jdbcTemplate.queryForObject(
        "SELECT payment_status FROM customer_orders WHERE customer_name = ?",
        String.class,
        "Riya");
    assertThat(paymentStatus).isEqualTo("PENDING");

    String orderStatus = jdbcTemplate.queryForObject(
        "SELECT order_status FROM customer_orders WHERE customer_name = ?",
        String.class,
        "Riya");
    assertThat(orderStatus).isEqualTo("PENDING");

    Boolean isDeleted = jdbcTemplate.queryForObject(
        "SELECT is_deleted FROM customer_orders WHERE customer_name = ?",
        Boolean.class,
        "Riya");
    assertThat(isDeleted).isFalse();

    Integer legacyPhoneColumnCount = jdbcTemplate.queryForObject(
        """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE UPPER(table_name) = 'CUSTOMER_ORDERS'
              AND UPPER(column_name) = 'PHONE'
            """,
        Integer.class);
    assertThat(legacyPhoneColumnCount).isZero();

    Integer variantIdColumnCount = jdbcTemplate.queryForObject(
        """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE UPPER(table_name) = 'ORDER_ITEMS'
              AND UPPER(column_name) = 'VARIANT_ID'
            """,
        Integer.class);
    assertThat(variantIdColumnCount).isEqualTo(1);

    Integer variantColorColumnCount = jdbcTemplate.queryForObject(
        """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE UPPER(table_name) = 'ORDER_ITEMS'
              AND UPPER(column_name) = 'VARIANT_COLOR'
            """,
        Integer.class);
    assertThat(variantColorColumnCount).isEqualTo(1);

    Integer variantSizeColumnCount = jdbcTemplate.queryForObject(
        """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE UPPER(table_name) = 'ORDER_ITEMS'
              AND UPPER(column_name) = 'VARIANT_SIZE'
            """,
        Integer.class);
    assertThat(variantSizeColumnCount).isEqualTo(1);

    String productName = jdbcTemplate.queryForObject(
        "SELECT product_name FROM order_items WHERE id = ?",
        String.class,
        1L);
    assertThat(productName).isEqualTo("Legacy Earbuds");

    Integer quantity = jdbcTemplate.queryForObject(
        "SELECT quantity FROM order_items WHERE id = ?",
        Integer.class,
        1L);
    assertThat(quantity).isEqualTo(2);
  }
}
