package com.v.medical.controller;

import com.v.medical.Service.InventoryAnalyticsService;
import com.v.medical.dto.InventoryAnalyticsResponse;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory/analytics")
public class InventoryAnalyticsController {

    private final InventoryAnalyticsService
            analyticsService;

    public InventoryAnalyticsController(
            InventoryAnalyticsService analyticsService) {

        this.analyticsService =
                analyticsService;
    }

    // ==========================================
    // COMPLETE ANALYTICS
    // ==========================================

    @GetMapping
    public ResponseEntity<
            InventoryAnalyticsResponse>
    getAnalytics() {

        return ResponseEntity.ok(
                analyticsService
                        .getAnalytics()
        );
    }

    // ==========================================
    // KPI
    // ==========================================

    @GetMapping("/summary")
    public ResponseEntity<
            InventoryAnalyticsResponse>
    getSummary() {

        return ResponseEntity.ok(
                analyticsService
                        .getSummary()
        );
    }

    // ==========================================
    // STOCK MOVEMENT
    // ==========================================

    @GetMapping("/stock-movement")
    public ResponseEntity<?> stockMovement(
            @RequestParam(
                    defaultValue = "30"
            )
            int days) {

        return ResponseEntity.ok(
                analyticsService
                        .getStockMovement(days)
        );
    }

    // ==========================================
    // CATEGORY
    // ==========================================

    @GetMapping("/categories")
    public ResponseEntity<?> categories() {

        return ResponseEntity.ok(
                analyticsService
                        .getCategoryAnalytics()
        );
    }

    // ==========================================
    // STOCK VALUE
    // ==========================================

    @GetMapping("/stock-value")
    public ResponseEntity<?> stockValue() {

        return ResponseEntity.ok(
                analyticsService
                        .getStockValueAnalytics()
        );
    }

    // ==========================================
    // LOW STOCK
    // ==========================================

    @GetMapping("/low-stock")
    public ResponseEntity<?> lowStock() {

        return ResponseEntity.ok(
                analyticsService
                        .getLowStockAnalytics()
        );
    }

    // ==========================================
    // EXPIRING
    // ==========================================

    @GetMapping("/expiring")
    public ResponseEntity<?> expiring() {

        return ResponseEntity.ok(
                analyticsService
                        .getExpiringAnalytics()
        );
    }

    // ==========================================
    // LOCATIONS
    // ==========================================

    @GetMapping("/locations")
    public ResponseEntity<?> locations() {

        return ResponseEntity.ok(
                analyticsService
                        .getLocationAnalytics()
        );
    }
}