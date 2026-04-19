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
        if (requirePostgres && explicitSettings.databaseMode() != Mode.POSTGRES) {
          throw new IllegalStateException(
              "Postgres is required, but spring.datasource.url/SPRING_DATASOURCE_URL is not a Postgres URL.");
        }
        applyConnectionSettings(systemProperties, explicitSettings);
        return BootstrapResult.externalSql(explicitSettings.databaseMode(), explicitSettings.source());
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
            "POSTGRES_URL",
            "MYSQL_URL");
    if (urlSettings != null) {
      if (requirePostgres && urlSettings.databaseMode() != Mode.POSTGRES) {
        throw new IllegalStateException(
            "Postgres is required, but the detected database URL is not a Postgres URL.");
      }
      applyConnectionSettings(systemProperties, urlSettings);
      return BootstrapResult.externalSql(urlSettings.databaseMode(), urlSettings.source());
    }

    ConnectionSettings componentSettings = connectionSettingsFromComponents(environment);
    if (componentSettings != null) {
      if (requirePostgres && componentSettings.databaseMode() != Mode.POSTGRES) {
        throw new IllegalStateException(
            "Postgres is required, but the detected database component settings are not Postgres.");
      }
      applyConnectionSettings(systemProperties, componentSettings);
      return BootstrapResult.externalSql(componentSettings.databaseMode(), componentSettings.source());
    }

    if (requirePostgres) {
      throw new IllegalStateException(
          "Postgres is required, but no database connection settings were found. "
              + "Set DATABASE_URL, SPRING_DATASOURCE_*, or PG*/POSTGRES_* env vars.");
    }

    String normalizedDataDir = normalizeDataDir(environment);
    systemProperties.setProperty(
        "spring.datasource.url",
        "jdbc:h2:file:"
            + normalizedDataDir
            + "/gadget69db;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_ON_EXIT=FALSE");

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
            "PG*/POSTGRES_* environment variables",
            Mode.POSTGRES);
    if (pgSettings != null) {
      return pgSettings;
    }

    ConnectionSettings mysqlSettings =
        connectionSettingsFromComponents(
            firstNonBlank(environment.get("MYSQL_HOST"), environment.get("MYSQLHOST")),
            firstNonBlank(environment.get("MYSQL_PORT"), environment.get("MYSQLPORT")),
            firstNonBlank(environment.get("MYSQL_DATABASE"), environment.get("MYSQL_DB")),
            firstNonBlank(environment.get("MYSQL_USER"), environment.get("MYSQL_USERNAME")),
            firstNonBlank(environment.get("MYSQL_PASSWORD")),
            "MYSQL_* environment variables",
            Mode.MYSQL);
    if (mysqlSettings != null) {
      return mysqlSettings;
    }

    return null;
  }

  private static ConnectionSettings connectionSettingsFromComponents(
      String host,
      String port,
      String database,
      String username,
      String password,
      String source,
      Mode databaseMode) {
    if (!hasText(host) || !hasText(database)) {
      return null;
    }

    String jdbcPort = hasText(port) ? port : defaultPort(databaseMode);
    String jdbcPrefix = databaseMode == Mode.MYSQL ? "jdbc:mysql://" : "jdbc:postgresql://";
    return new ConnectionSettings(
        jdbcPrefix + host + ":" + jdbcPort + "/" + stripLeadingSlash(database),
        username,
        password,
        source,
        databaseMode);
  }

  private static ConnectionSettings connectionSettingsFromUrl(
      String candidateUrl, String explicitUsername, String explicitPassword, String source) {
    if (!hasText(candidateUrl)) {
      return null;
    }

    if (candidateUrl.regionMatches(true, 0, "jdbc:postgresql:", 0, "jdbc:postgresql:".length())) {
      return new ConnectionSettings(candidateUrl, explicitUsername, explicitPassword, source, Mode.POSTGRES);
    }

    if (candidateUrl.regionMatches(true, 0, "jdbc:mysql:", 0, "jdbc:mysql:".length())) {
      return new ConnectionSettings(candidateUrl, explicitUsername, explicitPassword, source, Mode.MYSQL);
    }

    if (candidateUrl.regionMatches(true, 0, "jdbc:", 0, "jdbc:".length())) {
      return null;
    }

    URI uri = URI.create(candidateUrl);
    String scheme = uri.getScheme();
    if (!hasText(scheme)) {
      return null;
    }

    Mode databaseMode = modeFromScheme(scheme);
    if (databaseMode == null) {
      return null;
    }

    if (!hasText(uri.getHost()) || !hasText(uri.getPath()) || "/".equals(uri.getPath())) {
      throw new IllegalStateException(source + " must include a host and database name");
    }

    int port = uri.getPort() > 0 ? uri.getPort() : Integer.parseInt(defaultPort(databaseMode));
    String jdbcPrefix = databaseMode == Mode.MYSQL ? "jdbc:mysql://" : "jdbc:postgresql://";
    String jdbcUrl = jdbcPrefix + uri.getHost() + ":" + port + uri.getPath();
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

    return new ConnectionSettings(jdbcUrl, username, password, source, databaseMode);
  }

  private static Mode modeFromScheme(String scheme) {
    if ("postgres".equalsIgnoreCase(scheme) || "postgresql".equalsIgnoreCase(scheme)) {
      return Mode.POSTGRES;
    }
    if ("mysql".equalsIgnoreCase(scheme)) {
      return Mode.MYSQL;
    }
    return null;
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

  private static String defaultPort(Mode databaseMode) {
    return databaseMode == Mode.MYSQL ? "3306" : "5432";
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
    public static BootstrapResult externalSql(Mode mode, String source) {
      return new BootstrapResult(mode, source);
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
    MYSQL,
    EMBEDDED_H2
  }

  private record ConnectionSettings(
      String url, String username, String password, String source, Mode databaseMode) {}
}
