package com.medistock.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** Aggregated numbers shown on the dashboards. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardStats {
    private long totalMedicines;
    private long totalSuppliers;
    private long totalUsers;
    private long lowStockCount;
    private long outOfStockCount;
    private long nearExpiryCount;
    private long expiredCount;
    private BigDecimal inventoryValue;
    private BigDecimal totalPurchaseCost;
    /** category name -> total quantity, used by the dashboard chart. */
    private Map<String, Long> stockByCategory;
    /** supplier name -> number of medicines supplied. */
    private Map<String, Long> medicinesBySupplier;
    private List<String> recentActivity;
}
