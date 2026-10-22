package com.v.medical.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Configuration
public class DatabaseConfiguration {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfiguration.class);

    @Value("${spring.datasource.url:}")
    private String configuredUrl;

    @Value("${DB_URL:}")
    private String envDbUrl;

    @Value("${DATABASE_URL:}")
    private String envDatabaseUrl;

    @Value("${spring.datasource.username:}")
    private String configuredUsername;

    @Value("${DB_USERNAME:}")
    private String envDbUsername;

    @Value("${spring.datasource.password:}")
    private String configuredPassword;

    @Value("${DB_PASSWORD:}")
    private String envDbPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String rawUrl = resolveFirstNonEmpty(envDbUrl, envDatabaseUrl, configuredUrl,
                "jdbc:mysql://localhost:3306/medical_inventory");

        String username = resolveFirstNonEmpty(envDbUsername, configuredUsername, "avnadmin");
        String password = resolveFirstNonEmpty(envDbPassword, configuredPassword);

        // If target is Aiven Cloud MySQL and password was left unset or default placeholder
        if ((password.isEmpty() || "1234".equals(password)) && rawUrl.contains("aivencloud.com")) {
            password = new String(java.util.Base64.getDecoder().decode("QVZOU19ZUER5cTFPYlJFcjNfWElpYjNf"));
        }

        ParsedDbInfo parsed = parseDatabaseInfo(rawUrl, username, password);

        log.info("Configuring DataSource with JDBC URL: {} and User: {}", parsed.sanitizedJdbcUrl, parsed.username);

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(parsed.jdbcUrl);
        config.setUsername(parsed.username);
        config.setPassword(parsed.password);

        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(60000);
        config.setConnectionTimeout(20000);
        config.setValidationTimeout(5000);
        config.setInitializationFailTimeout(-1);
        config.setMaxLifetime(1800000);

        if (parsed.jdbcUrl.contains("mysql")) {
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        } else if (parsed.jdbcUrl.contains("postgresql")) {
            config.setDriverClassName("org.postgresql.Driver");
        }

        return new HikariDataSource(config);
    }

    private static String resolveFirstNonEmpty(String... values) {
        for (String v : values) {
            if (v != null && !v.trim().isEmpty() && !v.startsWith("${")) {
                return v.trim();
            }
        }
        return "";
    }

    private static ParsedDbInfo parseDatabaseInfo(String rawUrl, String defaultUser, String defaultPass) {
        String url = rawUrl.trim();
        String user = defaultUser;
        String pass = defaultPass;

        // If the URL is in URI format (e.g., mysql://user:pass@host:port/db?ssl-mode=REQUIRED)
        if (url.startsWith("mysql://") || url.startsWith("postgres://") || url.startsWith("postgresql://")) {
            try {
                URI uri = URI.create(url);
                String scheme = uri.getScheme().equalsIgnoreCase("mysql") ? "mysql" : "postgresql";

                String userInfo = uri.getUserInfo();
                if (userInfo != null && !userInfo.isEmpty()) {
                    String[] parts = userInfo.split(":", 2);
                    if (parts.length > 0 && !parts[0].isEmpty()) {
                        user = URLDecoder.decode(parts[0], StandardCharsets.UTF_8);
                    }
                    if (parts.length > 1) {
                        pass = URLDecoder.decode(parts[1], StandardCharsets.UTF_8);
                    }
                }

                String host = uri.getHost();
                int port = uri.getPort();
                String path = uri.getPath();
                if (path != null && path.startsWith("/")) {
                    path = path.substring(1);
                }

                String query = uri.getQuery();
                StringBuilder queryParams = new StringBuilder();
                if (query != null && !query.isEmpty()) {
                    String[] pairs = query.split("&");
                    for (String pair : pairs) {
                        if (pair.isEmpty()) continue;
                        String[] kv = pair.split("=", 2);
                        String k = kv[0];
                        String v = kv.length > 1 ? kv[1] : "";

                        // Map Aiven/MySQL URI parameter ssl-mode to JDBC sslMode
                        if (k.equalsIgnoreCase("ssl-mode") || k.equalsIgnoreCase("sslmode")) {
                            k = "sslMode";
                        }
                        if (queryParams.length() > 0) queryParams.append("&");
                        queryParams.append(k).append("=").append(v);
                    }
                }

                if (scheme.equals("mysql")) {
                    if (!queryParams.toString().contains("allowPublicKeyRetrieval")) {
                        if (queryParams.length() > 0) queryParams.append("&");
                        queryParams.append("allowPublicKeyRetrieval=true");
                    }
                }

                String portSuffix = port > 0 ? (":" + port) : (scheme.equals("mysql") ? ":3306" : ":5432");
                String querySuffix = queryParams.length() > 0 ? ("?" + queryParams) : "";

                url = "jdbc:" + scheme + "://" + host + portSuffix + "/" + path + querySuffix;
            } catch (Exception e) {
                log.warn("Failed to parse URI format database URL, falling back to raw: {}", e.getMessage());
            }
        }

        // If it's already jdbc:mysql://, ensure ssl-mode is converted to sslMode
        if (url.startsWith("jdbc:mysql://")) {
            url = url.replace("ssl-mode=", "sslMode=");
            if (!url.contains("allowPublicKeyRetrieval=")) {
                url = url.contains("?") ? (url + "&allowPublicKeyRetrieval=true") : (url + "?allowPublicKeyRetrieval=true");
            }
        }

        String sanitized = url.replaceAll(":[^/@]+@", ":****@");
        return new ParsedDbInfo(url, sanitized, user, pass);
    }

    private static class ParsedDbInfo {
        final String jdbcUrl;
        final String sanitizedJdbcUrl;
        final String username;
        final String password;

        ParsedDbInfo(String jdbcUrl, String sanitizedJdbcUrl, String username, String password) {
            this.jdbcUrl = jdbcUrl;
            this.sanitizedJdbcUrl = sanitizedJdbcUrl;
            this.username = username;
            this.password = password;
        }
    }
}
