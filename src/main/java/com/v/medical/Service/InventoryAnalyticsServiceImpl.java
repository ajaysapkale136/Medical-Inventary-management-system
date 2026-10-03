package com.v.medical.Service;

import com.v.medical.dto.InventoryAnalyticsResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;

@Service
public class InventoryAnalyticsServiceImpl
        implements InventoryAnalyticsService {

    @Override
    public InventoryAnalyticsResponse getAnalytics() {

        InventoryAnalyticsResponse response =
                new InventoryAnalyticsResponse();

        response.setTotalMedicines(0);
        response.setTotalStockUnits(0);
        response.setLowStockItems(0);
        response.setOutOfStockItems(0);
        response.setExpiredItems(0);
        response.setExpiringSoonItems(0);

        response.setTotalStockValue(
                BigDecimal.ZERO
        );

        response.setCategories(
                new ArrayList<>()
        );

        response.setStockMovement(
                new ArrayList<>()
        );

        response.setMonthlyStockValue(
                new ArrayList<>()
        );

        response.setLowStockMedicines(
                new ArrayList<>()
        );

        response.setExpiringMedicines(
                new ArrayList<>()
        );

        response.setLocations(
                new ArrayList<>()
        );

        return response;
    }

    @Override
    public InventoryAnalyticsResponse getSummary() {

        InventoryAnalyticsResponse response =
                new InventoryAnalyticsResponse();

        response.setTotalMedicines(0);
        response.setTotalStockUnits(0);
        response.setLowStockItems(0);
        response.setOutOfStockItems(0);
        response.setExpiredItems(0);
        response.setExpiringSoonItems(0);

        response.setTotalStockValue(
                BigDecimal.ZERO
        );

        return response;
    }

    @Override
    public Object getStockMovement(int days) {

        return new ArrayList<>();
    }

    @Override
    public Object getCategoryAnalytics() {

        return new ArrayList<>();
    }

    @Override
    public Object getStockValueAnalytics() {

        return new ArrayList<>();
    }

    @Override
    public Object getLowStockAnalytics() {

        return new ArrayList<>();
    }

    @Override
    public Object getExpiringAnalytics() {

        return new ArrayList<>();
    }

    @Override
    public Object getLocationAnalytics() {

        return new ArrayList<>();
    }
}