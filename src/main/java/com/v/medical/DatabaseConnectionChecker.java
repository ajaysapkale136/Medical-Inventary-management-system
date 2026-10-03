package com.v.medical;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Component
public class DatabaseConnectionChecker implements CommandLineRunner {

    private final DataSource dataSource;

    public DatabaseConnectionChecker(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) throws Exception {
        if (dataSource.getConnection().isValid(2)) {
            System.out.println("=========================================");
            System.out.println("✅ Database Connected Successfully!");
            System.out.println("=========================================");
        }
    }
}