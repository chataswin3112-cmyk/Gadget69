package com.gadget69.catalog.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Properties;

public final class DatasourceBootstrap {
  private DatasourceBootstrap() {}

  public static BootstrapResult configure(Properties systemProperties, Map<String, String> environment) {
    boolean requirePostgres = isTruthy(environment.get("APP_REQUIRE_POSTGRES"));
    String explicitDatasourceUrl =
        firstNonBlank(
            systemProperties.getProperty("spring.datasource.url"),
            environment.get("SPRING_DATASOURCE_URL"));

    if (hasText(explicitDatasourceUrl)) {
      ConnectionSettings explicitSettings =
          connectionSettingsFromUrl(
              explicitDatasourceUrl,
              firstNonBlank(
                  systemProperties.getProperty("spring.datasource.username"),
                  environment.get("SPRING_DATASOURCE_USERNAME")),
              firstNonBlank(
                  systemProperties.getProperty("spring.datasource.password"),
                  environment.get("SPRING_DATASOURCE_PASSWORD")),
              "spring.datasource.url/SPRING_DATASOURCE_URL");

      if (explicitSettings != null) {
        applyConnectionSettings(systemProperties, explicitSettings);
        return BootstrapResult.postgres(explicitSettings.source());
      }

      if (requirePostgres) {
        throw new IllegalStateException(
            "Postgres is required, but spring.datasource.url/SPRING_DATASOURCE_URL is not a Postgres URL.");
      }

      return BootstrapResult.unchanged();
    }

    ConnectionSettings urlSettings =
        firstConnectionSettingsFromEnvironment(
            environment,
            "DATABASE_URL",
            "RENDER_DATABASE_URL",
            "JDBC_DATABASE_URL",
            "POSTGRES_URL");
    if (urlSettings != null) {
      applyConnectionSettings(systemProperties, urlSettings);
      return BootstrapResult.postgres(urlSettings.source());
    }

    ConnectionSettings componentSettings = connectionSettingsFromComponents(environment);
    if (componentSettings != null) {
      applyConnectionSettings(systemProperties, componentSettings);
      return BootstrapResult.postgres(componentSettings.source());
    }

    if (requirePostgres) {
      throw new IllegalStateException(
          "Postgres is required, but no database connection settings were found. "
              + "Set DATABASE_URL, SPRING_DATASOURCE_URL, or PG*/POSTGRES_* env vars.");
    }

    String normalizedDataDir = normalizeDataDir(environment);
    systemProperties.setProperty(
        "spring.datasource.url",
        "jdbc:h2:file:"
            + normalizedDataDir
            + "/gadget69db;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_ON_EXIT=FALSE");

    if (!hasText(systemProperties.getProperty("spring.datasource.username"))
        && !hasText(environment.get("SPRING_DATASOURCE_USERNAME"))) {
      systemProperties.setProperty("spring.datasource.username", "sa");
    }

    if (!hasText(systemProperties.getProperty("spring.datasource.password"))
        && !hasText(environment.get("SPRING_DATASOURCE_PASSWORD"))) {
      systemProperties.setProperty("spring.datasource.password", "");
    }

    return BootstrapResult.embeddedH2(normalizedDataDir);
  }

  private static ConnectionSettings firstConnectionSettingsFromEnvironment(
      Map<String, String> environment, String... envKeys) {
    for (String envKey : envKeys) {
      ConnectionSettings settings =
          connectionSettingsFromUrl(environment.get(envKey), null, null, envKey);
      if (settings != null) {
        return settings;
      }
    }

    return null;
  }

  private static ConnectionSettings connectionSettingsFromComponents(Map<String, String> environment) {
    ConnectionSettings pgSettings =
        connectionSettingsFromComponents(
            firstNonBlank(environment.get("PGHOST"), environment.get("POSTGRES_HOST")),
            firstNonBlank(environment.get("PGPORT"), environment.get("POSTGRES_PORT")),
            firstNonBlank(environment.get("PGDATABASE"), environment.get("POSTGRES_DB"), environment.get("POSTGRES_DATABASE")),
            firstNonBlank(environment.get("PGUSER"), environment.get("POSTGRES_USER")),
            firstNonBlank(environment.get("PGPASSWORD"), environment.get("POSTGRES_PASSWORD")),
            "PG*/POSTGRES_* environment variables");
    if (pgSettings != null) {
      return pgSettings;
    }

    return connectionSettingsFromComponents(
        environment.get("DATABASE_HOST"),
        environment.get("DATABASE_PORT"),
        firstNonBlank(environment.get("DATABASE_NAME"), environment.get("DATABASE_DB")),
        environment.get("DATABASE_USER"),
        environment.get("DATABASE_PASSWORD"),
        "DATABASE_* environment variables");
  }

  private static ConnectionSettings connectionSettingsFromComponents(
      String host, String port, String database, String username, String password, String source) {
    if (!hasText(host) || !hasText(database)) {
      return null;
    }

    String jdbcPort = hasText(port) ? port : "5432";
    return new ConnectionSettings(
        "jdbc:postgresql://" + host + ":" + jdbcPort + "/" + stripLeadingSlash(database),
        username,
        password,
        source);
  }

  private static ConnectionSettings connectionSettingsFromUrl(
      String candidateUrl, String explicitUsername, String explicitPassword, String source) {
    if (!hasText(candidateUrl)) {
      return null;
    }

    if (candidateUrl.regionMatches(true, 0, "jdbc:postgresql:", 0, "jdbc:postgresql:".length())) {
      return new ConnectionSettings(candidateUrl, explicitUsername, explicitPassword, source);
    }

    if (candidateUrl.regionMatches(true, 0, "jdbc:", 0, "jdbc:".length())) {
      return null;
    }

    URI uri = URI.create(candidateUrl);
    String scheme = uri.getScheme();
    if (!hasText(scheme)
        || (!"postgres".equalsIgnoreCase(scheme) && !"postgresql".equalsIgnoreCase(scheme))) {
      return null;
    }

    if (!hasText(uri.getHost()) || !hasText(uri.getPath()) || "/".equals(uri.getPath())) {
      throw new IllegalStateException(source + " must include a host and database name");
    }

    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
    String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getPath();
    if (hasText(uri.getRawQuery())) {
      jdbcUrl += "?" + uri.getRawQuery();
    }

    String username = explicitUsername;
    String password = explicitPassword;
    if (!hasText(username) || !hasText(password)) {
      String userInfo = uri.getRawUserInfo();
      if (hasText(userInfo)) {
        String[] parts = userInfo.split(":", 2);
        if (!hasText(username) && parts.length > 0 && hasText(parts[0])) {
          username = decode(parts[0]);
        }
        if (!hasText(password) && parts.length > 1 && hasText(parts[1])) {
          password = decode(parts[1]);
        }
      }
    }

    return new ConnectionSettings(jdbcUrl, username, password, source);
  }

  private static void applyConnectionSettings(Properties systemProperties, ConnectionSettings settings) {
    systemProperties.setProperty("spring.datasource.url", settings.url());

    if (hasText(settings.username())) {
      systemProperties.setProperty("spring.datasource.username", settings.username());
    }

    if (settings.password() != null) {
      systemProperties.setProperty("spring.datasource.password", settings.password());
    }
  }

  private static String normalizeDataDir(Map<String, String> environment) {
    String dataDir =
        firstNonBlank(
            environment.get("APP_DATA_DIR"),
            hasText(environment.get("RENDER")) ? "/var/data/data" : "./data");
    String normalizedDataDir = dataDir.replace('\\', '/');
    while (normalizedDataDir.endsWith("/")) {
      normalizedDataDir = normalizedDataDir.substring(0, normalizedDataDir.length() - 1);
    }
    return normalizedDataDir;
  }

  private static String stripLeadingSlash(String value) {
    String normalized = value;
    while (normalized.startsWith("/")) {
      normalized = normalized.substring(1);
    }
    return normalized;
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

  private static boolean isTruthy(String value) {
    return "true".equalsIgnoreCase(value)
        || "1".equals(value)
        || "yes".equalsIgnoreCase(value)
        || "on".equalsIgnoreCase(value);
  }

  private static String decode(String value) {
    return URLDecoder.decode(value, StandardCharsets.UTF_8);
  }

  public record BootstrapResult(Mode mode, String detail) {
    public static BootstrapResult postgres(String source) {
      return new BootstrapResult(Mode.POSTGRES, source);
    }

    public static BootstrapResult embeddedH2(String dataDir) {
      return new BootstrapResult(Mode.EMBEDDED_H2, dataDir);
    }

    public static BootstrapResult unchanged() {
      return new BootstrapResult(Mode.UNCHANGED, null);
    }
  }

  public enum Mode {
    UNCHANGED,
    POSTGRES,
    EMBEDDED_H2
  }

  private record ConnectionSettings(String url, String username, String password, String source) {}
}
