package com.gadget69.catalog.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
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
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS order_status VARCHAR(255)");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(512)");
    apply("ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS last_razorpay_event_id VARCHAR(255)");
    apply("UPDATE customer_orders SET currency = 'INR' WHERE currency IS NULL OR TRIM(currency) = ''");
    apply("UPDATE customer_orders SET order_status = 'PLACED' WHERE order_status IS NULL OR TRIM(order_status) = ''");
    apply("ALTER TABLE customer_orders ALTER COLUMN currency SET DEFAULT 'INR'");
    apply("ALTER TABLE customer_orders ALTER COLUMN currency SET NOT NULL");
    apply("ALTER TABLE customer_orders ALTER COLUMN order_status SET DEFAULT 'PLACED'");
    apply("ALTER TABLE customer_orders ALTER COLUMN order_status SET NOT NULL");
  }

  private void apply(String sql) {
    jdbcTemplate.execute(sql);
    log.debug("Applied legacy schema repair: {}", sql);
  }
}
