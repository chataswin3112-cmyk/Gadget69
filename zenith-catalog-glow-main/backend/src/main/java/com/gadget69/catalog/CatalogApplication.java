package com.gadget69.catalog;

import com.gadget69.catalog.config.AppProperties;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class CatalogApplication {

  public static void main(String[] args) {
    configureDatasourceFromDatabaseUrl();
    SpringApplication.run(CatalogApplication.class, args);
  }

  private static void configureDatasourceFromDatabaseUrl() {
    if (hasText(System.getProperty("spring.datasource.url"))
        || hasText(System.getenv("SPRING_DATASOURCE_URL"))) {
      return;
    }

    String databaseUrl = firstNonBlank(System.getenv("DATABASE_URL"), System.getenv("RENDER_DATABASE_URL"));
    if (!hasText(databaseUrl)) {
      return;
    }

    URI uri = URI.create(databaseUrl);
    String scheme = uri.getScheme();
    if (!hasText(scheme)
        || (!"postgres".equalsIgnoreCase(scheme) && !"postgresql".equalsIgnoreCase(scheme))) {
      return;
    }

    if (!hasText(uri.getHost()) || !hasText(uri.getPath()) || "/".equals(uri.getPath())) {
      throw new IllegalStateException("DATABASE_URL must include a host and database name");
    }

    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
    String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getPath();
    if (hasText(uri.getRawQuery())) {
      jdbcUrl += "?" + uri.getRawQuery();
    }

    System.setProperty("spring.datasource.url", jdbcUrl);

    String userInfo = uri.getRawUserInfo();
    if (!hasText(userInfo)) {
      return;
    }

    String[] parts = userInfo.split(":", 2);
    if (parts.length > 0 && hasText(parts[0])) {
      System.setProperty("spring.datasource.username", decode(parts[0]));
    }
    if (parts.length > 1 && hasText(parts[1])) {
      System.setProperty("spring.datasource.password", decode(parts[1]));
    }
  }

  private static String firstNonBlank(String... values) {
    for (String value : values) {
      if (hasText(value)) {
        return value;
      }
    }
    return null;
  }

  private static boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private static String decode(String value) {
    return URLDecoder.decode(value, StandardCharsets.UTF_8);
  }
}
