package com.v.medical;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Component
public class DatabaseConnectionChecker implements CommandLineRunner {

    private final DataSource dataSource;

    public DatabaseConnectionChecker(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(5)) {
                System.out.println("=========================================");
                System.out.println("✅ Database Connected Successfully!");
                System.out.println("=========================================");
            }
        } catch (Exception e) {
            System.err.println("⚠️ Warning: Initial database connection check: " + e.getMessage());
            System.err.println("⚠️ Application will continue running. Connection will be retried when needed.");
        }
    }
}
