package com.gadget69.catalog;

import com.gadget69.catalog.config.AppProperties;
import com.gadget69.catalog.config.DatasourceBootstrap;
import com.gadget69.catalog.config.DatasourceBootstrap.BootstrapResult;
import com.gadget69.catalog.config.DatasourceBootstrap.Mode;
import com.gadget69.catalog.config.LocalEnvLoader;
import com.gadget69.catalog.config.LocalEnvLoader.LoadResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
@EnableAsync
public class CatalogApplication {
  private static final Logger log = LoggerFactory.getLogger(CatalogApplication.class);

  public static void main(String[] args) {
    configureDatasourceFromDatabaseUrl();
    SpringApplication.run(CatalogApplication.class, args);
  }

  private static void configureDatasourceFromDatabaseUrl() {
    LoadResult env = LocalEnvLoader.load(System.getProperties(), System.getenv());
    if (!env.loadedFiles().isEmpty()) {
      log.info("Loaded local env overrides from {}", env.loadedFiles());
    }

    BootstrapResult result = DatasourceBootstrap.configure(System.getProperties(), env.environment());
    if (result.mode() == Mode.POSTGRES || result.mode() == Mode.MYSQL) {
      log.info("Configured {} datasource from {}", result.mode().name().toLowerCase(), result.detail());
      return;
    }

    if (result.mode() == Mode.EMBEDDED_H2) {
      log.warn(
          "No external SQL connection env found; falling back to embedded H2 at {}. "
              + "Set SPRING_DATASOURCE_* for MySQL/Postgres, DATABASE_URL for Postgres, or MYSQL_* env vars to use a managed database.",
          result.detail());
    }
  }
}
