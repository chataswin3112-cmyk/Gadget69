package com.gadget69.catalog.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.gadget69.catalog.config.DatasourceBootstrap.BootstrapResult;
import com.gadget69.catalog.config.DatasourceBootstrap.Mode;
import java.util.Map;
import java.util.Properties;
import org.junit.jupiter.api.Test;

class DatasourceBootstrapTest {

  @Test
  void configuresPostgresFromDatabaseUrl() {
    Properties systemProperties = new Properties();

    BootstrapResult result =
        DatasourceBootstrap.configure(
            systemProperties,
            Map.of(
                "DATABASE_URL",
                "postgresql://catalog_user:s3cr%40t@db.example.com:5433/catalog?sslmode=require"));

    assertEquals(Mode.POSTGRES, result.mode());
    assertEquals("DATABASE_URL", result.detail());
    assertEquals(
        "jdbc:postgresql://db.example.com:5433/catalog?sslmode=require",
        systemProperties.getProperty("spring.datasource.url"));
    assertEquals("catalog_user", systemProperties.getProperty("spring.datasource.username"));
    assertEquals("s3cr@t", systemProperties.getProperty("spring.datasource.password"));
  }

  @Test
  void normalizesSpringDatasourceUrlWhenItUsesRenderStylePostgresScheme() {
    Properties systemProperties = new Properties();

    BootstrapResult result =
        DatasourceBootstrap.configure(
            systemProperties,
            Map.of(
                "SPRING_DATASOURCE_URL",
                "postgres://catalog_user:secret@db.example.com/catalog"));

    assertEquals(Mode.POSTGRES, result.mode());
    assertEquals("spring.datasource.url/SPRING_DATASOURCE_URL", result.detail());
    assertEquals(
        "jdbc:postgresql://db.example.com:5432/catalog",
        systemProperties.getProperty("spring.datasource.url"));
    assertEquals("catalog_user", systemProperties.getProperty("spring.datasource.username"));
    assertEquals("secret", systemProperties.getProperty("spring.datasource.password"));
  }

  @Test
  void configuresPostgresFromDiscretePgEnvironmentVariables() {
    Properties systemProperties = new Properties();

    BootstrapResult result =
        DatasourceBootstrap.configure(
            systemProperties,
            Map.of(
                "PGHOST", "db.internal",
                "PGPORT", "6543",
                "PGDATABASE", "catalog",
                "PGUSER", "catalog_user",
                "PGPASSWORD", "catalog_secret"));

    assertEquals(Mode.POSTGRES, result.mode());
    assertEquals("PG*/POSTGRES_* environment variables", result.detail());
    assertEquals(
        "jdbc:postgresql://db.internal:6543/catalog",
        systemProperties.getProperty("spring.datasource.url"));
    assertEquals("catalog_user", systemProperties.getProperty("spring.datasource.username"));
    assertEquals("catalog_secret", systemProperties.getProperty("spring.datasource.password"));
  }

  @Test
  void fallsBackToEmbeddedH2WhenPostgresIsOptional() {
    Properties systemProperties = new Properties();

    BootstrapResult result =
        DatasourceBootstrap.configure(systemProperties, Map.of("APP_DATA_DIR", "/var/data/data"));

    assertEquals(Mode.EMBEDDED_H2, result.mode());
    assertEquals("/var/data/data", result.detail());
    assertEquals(
        "jdbc:h2:file:/var/data/data/gadget69db;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_ON_EXIT=FALSE",
        systemProperties.getProperty("spring.datasource.url"));
    assertEquals("sa", systemProperties.getProperty("spring.datasource.username"));
    assertEquals("", systemProperties.getProperty("spring.datasource.password"));
  }

  @Test
  void failsFastWhenPostgresIsRequiredButMissing() {
    Properties systemProperties = new Properties();

    IllegalStateException exception =
        assertThrows(
            IllegalStateException.class,
            () ->
                DatasourceBootstrap.configure(
                    systemProperties,
                    Map.of(
                        "APP_REQUIRE_POSTGRES", "true",
                        "APP_DATA_DIR", "/var/data/data")));

    assertEquals(
        "Postgres is required, but no database connection settings were found. "
            + "Set DATABASE_URL, SPRING_DATASOURCE_URL, or PG*/POSTGRES_* env vars.",
        exception.getMessage());
  }

  @Test
  void failsFastWhenPostgresIsRequiredButExplicitDatasourceIsNotPostgres() {
    Properties systemProperties = new Properties();

    IllegalStateException exception =
        assertThrows(
            IllegalStateException.class,
            () ->
                DatasourceBootstrap.configure(
                    systemProperties,
                    Map.of(
                        "APP_REQUIRE_POSTGRES", "true",
                        "SPRING_DATASOURCE_URL", "jdbc:h2:mem:catalog")));

    assertEquals(
        "Postgres is required, but spring.datasource.url/SPRING_DATASOURCE_URL is not a Postgres URL.",
        exception.getMessage());
  }
}
