package com.v.medical.Service;

import com.v.medical.dto.InventoryAnalyticsResponse;

public interface InventoryAnalyticsService {

    InventoryAnalyticsResponse getAnalytics();

    InventoryAnalyticsResponse getSummary();

    Object getStockMovement(int days);

    Object getCategoryAnalytics();

    Object getStockValueAnalytics();

    Object getLowStockAnalytics();

    Object getExpiringAnalytics();

    Object getLocationAnalytics();
}