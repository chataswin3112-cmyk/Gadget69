package com.gadget69.catalog.config;

import jakarta.annotation.PostConstruct;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class LegacySchemaRepair {

  private static final Logger log = LoggerFactory.getLogger(LegacySchemaRepair.class);

  private final JdbcTemplate jdbcTemplate;

  public LegacySchemaRepair(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @PostConstruct
  public void afterPropertiesSet() {
    repairLegacySchemas();
  }

  void repairLegacySchemas() {
    repairAdminUsers();
    repairCatalogMedia();
    repairCustomerOrders();
    repairOrderItems();
    verifyAdminOrdersSchema();
  }

  private void repairAdminUsers() {
    if (!tableExists("admin_users")) {
      return;
    }

    apply("ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS token_version INTEGER");
    if (columnExists("admin_users", "token_version")) {
      apply("UPDATE admin_users SET token_version = 0 WHERE token_version IS NULL");
    }
  }

  private void repairCatalogMedia() {
    widenColumnIfPresent("sections", "image_url");
    widenColumnIfPresent("products", "image_url");
    widenColumnIfPresent("products", "video_url");
    widenColumnIfPresent("products", "default_thumbnail_url");
    widenColumnIfPresent("product_media", "media_url");
    widenColumnIfPresent("variant_media", "media_url");
    widenColumnIfPresent("community_media", "image_url");
    widenColumnIfPresent("community_media", "video_url");
    widenColumnIfPresent("community_media", "thumbnail_url");
    widenColumnIfPresent("banners", "desktop_image_url");
    widenColumnIfPresent("banners", "mobile_image_url");
    widenColumnIfPresent("store_settings", "logo_url");
    widenColumnIfPresent("store_settings", "favicon_url");
    widenColumnIfPresent("store_settings", "catalogue_url");
  }

  private void widenColumnIfPresent(String tableName, String columnName) {
    if (!tableExists(tableName) || !columnExists(tableName, columnName)) {
      return;
    }

    switch (databaseKind()) {
      case POSTGRESQL ->
          apply("ALTER TABLE " + tableName + " ALTER COLUMN " + columnName + " TYPE VARCHAR(2000)");
      case MYSQL ->
          apply("ALTER TABLE " + tableName + " MODIFY COLUMN " + columnName + " VARCHAR(2000)");
      case H2, UNKNOWN ->
          apply("ALTER TABLE " + tableName + " ALTER COLUMN " + columnName + " VARCHAR(2000)");
    }
  }

  private void repairCustomerOrders() {
    if (!tableExists("customer_orders")) {
      return;
    }

    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS email VARCHAR(255)");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS currency VARCHAR(255)");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS amount_paise INTEGER");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(255)");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS special_instructions VARCHAR(500)");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(255)");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS order_status VARCHAR(255)");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255)");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255)");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(512)");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS last_razorpay_event_id VARCHAR(255)");
    boolean legacyPhoneColumnExists = columnExists("customer_orders", "phone");
    if (legacyPhoneColumnExists && columnExists("customer_orders", "customer_phone")) {
      apply("UPDATE customer_orders SET customer_phone = phone WHERE (customer_phone IS NULL OR TRIM(customer_phone) = '') AND phone IS NOT NULL");
    }
    if (columnExists("customer_orders", "updated_at") && columnExists("customer_orders", "created_at")) {
      apply("UPDATE customer_orders SET updated_at = created_at WHERE updated_at IS NULL");
    }
    if (columnExists("customer_orders", "is_deleted")) {
      apply("UPDATE customer_orders SET is_deleted = FALSE WHERE is_deleted IS NULL");
    }
    if (columnExists("customer_orders", "currency")) {
      apply("UPDATE customer_orders SET currency = 'INR' WHERE currency IS NULL OR TRIM(currency) = ''");
    }
    if (columnExists("customer_orders", "payment_status")) {
      apply("UPDATE customer_orders SET payment_status = 'SUCCESS' WHERE UPPER(TRIM(payment_status)) IN ('PAID', 'CAPTURED')");
      apply("UPDATE customer_orders SET payment_status = 'PENDING' WHERE payment_status IS NULL OR TRIM(payment_status) = '' OR UPPER(TRIM(payment_status)) = 'AUTHORIZED'");
    }
    if (columnExists("customer_orders", "order_status")) {
      apply("UPDATE customer_orders SET order_status = 'PENDING' WHERE order_status IS NULL OR TRIM(order_status) = '' OR UPPER(TRIM(order_status)) = 'PLACED'");
      apply("UPDATE customer_orders SET order_status = 'OUT_FOR_DELIVERY' WHERE UPPER(TRIM(order_status)) = 'OUT FOR DELIVERY'");
    }
    if (legacyPhoneColumnExists) {
      // Current JPA writes customer_phone only, so the stale legacy phone column must not remain NOT NULL.
      apply("ALTER TABLE customer_orders DROP COLUMN IF EXISTS phone");
    }
    if (columnExists("customer_orders", "created_at")) {
      apply("CREATE INDEX IF NOT EXISTS idx_customer_orders_created_at ON customer_orders (created_at)");
    }
    if (columnExists("customer_orders", "customer_phone")) {
      apply("CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_phone ON customer_orders (customer_phone)");
    }
    if (columnExists("customer_orders", "order_status")) {
      apply("CREATE INDEX IF NOT EXISTS idx_customer_orders_order_status ON customer_orders (order_status)");
    }
    if (columnExists("customer_orders", "payment_status")) {
      apply("CREATE INDEX IF NOT EXISTS idx_customer_orders_payment_status ON customer_orders (payment_status)");
    }
    if (columnExists("customer_orders", "is_deleted")) {
      apply("CREATE INDEX IF NOT EXISTS idx_customer_orders_is_deleted ON customer_orders (is_deleted)");
    }
  }

  private void repairOrderItems() {
    if (!tableExists("order_items")) {
      return;
    }

    apply("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id BIGINT");
    apply("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_color VARCHAR(255)");
    apply("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_size VARCHAR(255)");
  }

  private void verifyAdminOrdersSchema() {
    boolean customerOrdersExists = tableExists("customer_orders");
    boolean orderItemsExists = tableExists("order_items");
    if (!customerOrdersExists && !orderItemsExists) {
      return;
    }

    requireTable("customer_orders");
    requireColumns(
        "customer_orders",
        "customer_name",
        "customer_phone",
        "email",
        "address",
        "pincode",
        "special_instructions",
        "total_amount",
        "currency",
        "amount_paise",
        "payment_status",
        "order_status",
        "razorpay_order_id",
        "razorpay_payment_id",
        "razorpay_signature",
        "last_razorpay_event_id",
        "created_at",
        "updated_at",
        "is_deleted");

    requireTable("order_items");
    requireColumns(
        "order_items",
        "order_id",
        "product_id",
        "product_name",
        "quantity",
        "price",
        "variant_id",
        "variant_color",
        "variant_size");
  }

  private void requireTable(String tableName) {
    if (!tableExists(tableName)) {
      failSchemaVerification(
          "Legacy schema repair could not prepare admin orders data. Required table '%s' is missing."
              .formatted(tableName));
    }
  }

  private void requireColumns(String tableName, String... columnNames) {
    List<String> missingColumns =
        Arrays.stream(columnNames)
            .filter(columnName -> !columnExists(tableName, columnName))
            .toList();

    if (!missingColumns.isEmpty()) {
      failSchemaVerification(
          "Legacy schema repair could not prepare admin orders table '%s'. Missing required columns: %s"
              .formatted(tableName, String.join(", ", missingColumns)));
    }
  }

  private void failSchemaVerification(String message) {
    log.error(message);
    throw new IllegalStateException(message);
  }

  private void apply(String sql) {
    try {
      jdbcTemplate.execute(sql);
      log.debug("Applied legacy schema repair: {}", sql);
    } catch (DataAccessException ex) {
      log.warn("Skipping legacy schema repair for unsupported SQL: {}", sql, ex);
    }
  }

  private boolean columnExists(String tableName, String columnName) {
    try {
      Integer count = jdbcTemplate.queryForObject(
          """
              SELECT COUNT(*)
              FROM information_schema.columns
              WHERE UPPER(table_name) = UPPER(?)
                AND UPPER(column_name) = UPPER(?)
                AND table_schema NOT IN ('information_schema', 'pg_catalog')
              """,
          Integer.class,
          tableName,
          columnName);
      return count != null && count > 0;
    } catch (DataAccessException exception) {
      log.debug("Could not inspect schema metadata for {}.{}", tableName, columnName, exception);
      return false;
    }
  }

  private boolean tableExists(String tableName) {
    try {
      Integer count = jdbcTemplate.queryForObject(
          """
              SELECT COUNT(*)
              FROM information_schema.tables
              WHERE UPPER(table_name) = UPPER(?)
                AND table_schema NOT IN ('information_schema', 'pg_catalog')
              """,
          Integer.class,
          tableName);
      return count != null && count > 0;
    } catch (DataAccessException exception) {
      log.debug("Could not inspect schema metadata for table {}", tableName, exception);
      return false;
    }
  }

  private DatabaseKind databaseKind() {
    try {
      if (jdbcTemplate.getDataSource() == null) {
        return DatabaseKind.UNKNOWN;
      }
      try (Connection connection = jdbcTemplate.getDataSource().getConnection()) {
        String productName = connection.getMetaData().getDatabaseProductName().toLowerCase();
        if (productName.contains("postgres")) {
          return DatabaseKind.POSTGRESQL;
        }
        if (productName.contains("mysql") || productName.contains("mariadb")) {
          return DatabaseKind.MYSQL;
        }
        if (productName.contains("h2")) {
          return DatabaseKind.H2;
        }
      }
    } catch (SQLException exception) {
      log.debug("Could not inspect database product name", exception);
    }
    return DatabaseKind.UNKNOWN;
  }

  private enum DatabaseKind {
    POSTGRESQL,
    MYSQL,
    H2,
    UNKNOWN
  }
}
