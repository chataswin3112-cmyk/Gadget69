package com.gadget69.catalog;

import com.gadget69.catalog.config.AppProperties;
import com.gadget69.catalog.config.DatasourceBootstrap;
import com.gadget69.catalog.config.DatasourceBootstrap.BootstrapResult;
import com.gadget69.catalog.config.DatasourceBootstrap.Mode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class CatalogApplication {
  private static final Logger log = LoggerFactory.getLogger(CatalogApplication.class);

  public static void main(String[] args) {
    configureDatasourceFromDatabaseUrl();
    SpringApplication.run(CatalogApplication.class, args);
  }

  private static void configureDatasourceFromDatabaseUrl() {
    BootstrapResult result = DatasourceBootstrap.configure(System.getProperties(), System.getenv());
    if (result.mode() == Mode.POSTGRES) {
      log.info("Configured datasource from {}", result.detail());
      return;
    }

    if (result.mode() == Mode.EMBEDDED_H2) {
      log.warn(
          "No Postgres connection env found; falling back to embedded H2 at {}. "
              + "Set DATABASE_URL, SPRING_DATASOURCE_URL, or PG*/POSTGRES_* env vars to use Postgres.",
          result.detail());
    }
  }
}
