package com.v.medical.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class InventoryAnalyticsResponse {

    // ==========================================
    // KPI
    // ==========================================

    private long totalMedicines;

    private long totalStockUnits;

    private long lowStockItems;

    private long outOfStockItems;

    private long expiredItems;

    private long expiringSoonItems;

    private BigDecimal totalStockValue;

    // ==========================================
    // CHART DATA
    // ==========================================

    private List<CategoryAnalytics> categories;

    private List<StockMovementAnalytics> stockMovement;

    private List<MonthlyValueAnalytics> monthlyStockValue;

    // ==========================================
    // INSIGHTS
    // ==========================================

    private List<MedicineInsight> lowStockMedicines;

    private List<MedicineInsight> expiringMedicines;

    private List<LocationAnalytics> locations;

    // ==========================================
    // GETTERS / SETTERS
    // ==========================================

    public long getTotalMedicines() {
        return totalMedicines;
    }

    public void setTotalMedicines(long totalMedicines) {
        this.totalMedicines = totalMedicines;
    }

    public long getTotalStockUnits() {
        return totalStockUnits;
    }

    public void setTotalStockUnits(long totalStockUnits) {
        this.totalStockUnits = totalStockUnits;
    }

    public long getLowStockItems() {
        return lowStockItems;
    }

    public void setLowStockItems(long lowStockItems) {
        this.lowStockItems = lowStockItems;
    }

    public long getOutOfStockItems() {
        return outOfStockItems;
    }

    public void setOutOfStockItems(long outOfStockItems) {
        this.outOfStockItems = outOfStockItems;
    }

    public long getExpiredItems() {
        return expiredItems;
    }

    public void setExpiredItems(long expiredItems) {
        this.expiredItems = expiredItems;
    }

    public long getExpiringSoonItems() {
        return expiringSoonItems;
    }

    public void setExpiringSoonItems(
            long expiringSoonItems) {
        this.expiringSoonItems =
                expiringSoonItems;
    }

    public BigDecimal getTotalStockValue() {
        return totalStockValue;
    }

    public void setTotalStockValue(
            BigDecimal totalStockValue) {
        this.totalStockValue =
                totalStockValue;
    }

    public List<CategoryAnalytics>
    getCategories() {
        return categories;
    }

    public void setCategories(
            List<CategoryAnalytics> categories) {
        this.categories = categories;
    }

    public List<StockMovementAnalytics>
    getStockMovement() {
        return stockMovement;
    }

    public void setStockMovement(
            List<StockMovementAnalytics>
                    stockMovement) {
        this.stockMovement =
                stockMovement;
    }

    public List<MonthlyValueAnalytics>
    getMonthlyStockValue() {
        return monthlyStockValue;
    }

    public void setMonthlyStockValue(
            List<MonthlyValueAnalytics>
                    monthlyStockValue) {
        this.monthlyStockValue =
                monthlyStockValue;
    }

    public List<MedicineInsight>
    getLowStockMedicines() {
        return lowStockMedicines;
    }

    public void setLowStockMedicines(
            List<MedicineInsight>
                    lowStockMedicines) {
        this.lowStockMedicines =
                lowStockMedicines;
    }

    public List<MedicineInsight>
    getExpiringMedicines() {
        return expiringMedicines;
    }

    public void setExpiringMedicines(
            List<MedicineInsight>
                    expiringMedicines) {
        this.expiringMedicines =
                expiringMedicines;
    }

    public List<LocationAnalytics>
    getLocations() {
        return locations;
    }

    public void setLocations(
            List<LocationAnalytics> locations) {
        this.locations = locations;
    }

    // ==========================================
    // INNER DTOs
    // ==========================================

    public static class CategoryAnalytics {

        private String category;
        private long items;
        private long stockUnits;
        private BigDecimal stockValue;

        public CategoryAnalytics() {
        }

        public CategoryAnalytics(
                String category,
                long items,
                long stockUnits,
                BigDecimal stockValue) {

            this.category = category;
            this.items = items;
            this.stockUnits = stockUnits;
            this.stockValue = stockValue;
        }

        public String getCategory() {
            return category;
        }

        public long getItems() {
            return items;
        }

        public long getStockUnits() {
            return stockUnits;
        }

        public BigDecimal getStockValue() {
            return stockValue;
        }
    }

    public static class StockMovementAnalytics {

        private String period;
        private long stockIn;
        private long stockOut;
        private long adjusted;
        private long returned;

        public StockMovementAnalytics() {
        }

        public StockMovementAnalytics(
                String period,
                long stockIn,
                long stockOut,
                long adjusted,
                long returned) {

            this.period = period;
            this.stockIn = stockIn;
            this.stockOut = stockOut;
            this.adjusted = adjusted;
            this.returned = returned;
        }

        public String getPeriod() {
            return period;
        }

        public long getStockIn() {
            return stockIn;
        }

        public long getStockOut() {
            return stockOut;
        }

        public long getAdjusted() {
            return adjusted;
        }

        public long getReturned() {
            return returned;
        }
    }

    public static class MonthlyValueAnalytics {

        private String month;
        private BigDecimal value;

        public MonthlyValueAnalytics() {
        }

        public MonthlyValueAnalytics(
                String month,
                BigDecimal value) {

            this.month = month;
            this.value = value;
        }

        public String getMonth() {
            return month;
        }

        public BigDecimal getValue() {
            return value;
        }
    }

    public static class MedicineInsight {

        private Long medicineId;
        private String medicineName;
        private long quantity;
        private long reorderLevel;
        private String status;

        public MedicineInsight() {
        }

        public MedicineInsight(
                Long medicineId,
                String medicineName,
                long quantity,
                long reorderLevel,
                String status) {

            this.medicineId = medicineId;
            this.medicineName = medicineName;
            this.quantity = quantity;
            this.reorderLevel = reorderLevel;
            this.status = status;
        }

        public Long getMedicineId() {
            return medicineId;
        }

        public String getMedicineName() {
            return medicineName;
        }

        public long getQuantity() {
            return quantity;
        }

        public long getReorderLevel() {
            return reorderLevel;
        }

        public String getStatus() {
            return status;
        }
    }

    public static class LocationAnalytics {

        private String location;
        private long totalQuantity;
        private BigDecimal stockValue;

        public LocationAnalytics() {
        }

        public LocationAnalytics(
                String location,
                long totalQuantity,
                BigDecimal stockValue) {

            this.location = location;
            this.totalQuantity = totalQuantity;
            this.stockValue = stockValue;
        }

        public String getLocation() {
            return location;
        }

        public long getTotalQuantity() {
            return totalQuantity;
        }

        public BigDecimal getStockValue() {
            return stockValue;
        }
    }
}