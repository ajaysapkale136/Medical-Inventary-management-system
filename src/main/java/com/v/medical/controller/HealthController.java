package com.v.medical.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("status", "UP");
        status.put("service", "MediStock Medical Inventory API");
        status.put("timestamp", Instant.now().toString());

        boolean databaseConnected = false;
        try (Connection conn = dataSource.getConnection()) {
            boolean dbConnected = conn.isValid(3);
            databaseConnected = dbConnected;
            status.put("database", dbConnected ? "CONNECTED" : "UNREACHABLE");
            status.put("databaseType", conn.getMetaData().getDatabaseProductName());
        } catch (Exception e) {
            status.put("database", "DISCONNECTED");
        }

        return ResponseEntity.status(databaseConnected ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
                .body(status);
    }
}
