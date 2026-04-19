package com.gadget69.catalog.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class LegacySchemaRepair implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(LegacySchemaRepair.class);

  private final JdbcTemplate jdbcTemplate;

  public LegacySchemaRepair(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @Override
  public void run(ApplicationArguments args) {
    repairLegacySchemas();
  }

  void repairLegacySchemas() {
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS currency VARCHAR(255)");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS amount_paise INTEGER");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(255)");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS order_status VARCHAR(255)");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(512)");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS last_razorpay_event_id VARCHAR(255)");
    apply("UPDATE customer_orders SET customer_phone = phone WHERE (customer_phone IS NULL OR TRIM(customer_phone) = '') AND phone IS NOT NULL");
    apply("UPDATE customer_orders SET updated_at = created_at WHERE updated_at IS NULL");
    apply("UPDATE customer_orders SET is_deleted = FALSE WHERE is_deleted IS NULL");
    apply("UPDATE customer_orders SET currency = 'INR' WHERE currency IS NULL OR TRIM(currency) = ''");
    apply("UPDATE customer_orders SET payment_status = 'SUCCESS' WHERE UPPER(TRIM(payment_status)) IN ('PAID', 'CAPTURED')");
    apply("UPDATE customer_orders SET payment_status = 'PENDING' WHERE payment_status IS NULL OR TRIM(payment_status) = '' OR UPPER(TRIM(payment_status)) = 'AUTHORIZED'");
    apply("UPDATE customer_orders SET order_status = 'PENDING' WHERE order_status IS NULL OR TRIM(order_status) = '' OR UPPER(TRIM(order_status)) = 'PLACED'");
    apply("UPDATE customer_orders SET order_status = 'OUT_FOR_DELIVERY' WHERE UPPER(TRIM(order_status)) = 'OUT FOR DELIVERY'");
    apply("ALTER TABLE customer_orders ALTER COLUMN currency SET DEFAULT 'INR'");
    apply("ALTER TABLE customer_orders ALTER COLUMN currency SET NOT NULL");
    apply("ALTER TABLE customer_orders ALTER COLUMN customer_phone SET NOT NULL");
    apply("ALTER TABLE customer_orders ALTER COLUMN payment_status SET DEFAULT 'PENDING'");
    apply("ALTER TABLE customer_orders ALTER COLUMN payment_status SET NOT NULL");
    apply("ALTER TABLE customer_orders ALTER COLUMN order_status SET DEFAULT 'PENDING'");
    apply("ALTER TABLE customer_orders ALTER COLUMN order_status SET NOT NULL");
    apply("ALTER TABLE customer_orders ALTER COLUMN updated_at SET NOT NULL");
    apply("ALTER TABLE customer_orders ALTER COLUMN is_deleted SET DEFAULT FALSE");
    apply("ALTER TABLE customer_orders ALTER COLUMN is_deleted SET NOT NULL");
    apply("CREATE INDEX IF NOT EXISTS idx_customer_orders_created_at ON customer_orders (created_at)");
    apply("CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_phone ON customer_orders (customer_phone)");
    apply("CREATE INDEX IF NOT EXISTS idx_customer_orders_order_status ON customer_orders (order_status)");
    apply("CREATE INDEX IF NOT EXISTS idx_customer_orders_payment_status ON customer_orders (payment_status)");
    apply("CREATE INDEX IF NOT EXISTS idx_customer_orders_is_deleted ON customer_orders (is_deleted)");
  }

  private void apply(String sql) {
    try {
      jdbcTemplate.execute(sql);
      log.debug("Applied legacy schema repair: {}", sql);
    } catch (DataAccessException ex) {
      log.warn("Skipping legacy schema repair for unsupported SQL: {}", sql, ex);
    }
  }
}
