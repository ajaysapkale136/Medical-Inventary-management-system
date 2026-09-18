package com.medistock.service;

import com.medistock.dto.DashboardStats;
import com.medistock.entity.*;
import com.medistock.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/** Builds the numbers shown on the Admin and Pharmacist dashboards. */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final MedicineRepository medicineRepository;
    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final PurchaseRepository purchaseRepository;
    private final StockMovementRepository stockMovementRepository;
    private final MedicineService medicineService;

    public DashboardStats build() {
        List<Medicine> all = medicineRepository.findAll();

        Map<String, Long> stockByCategory = all.stream().collect(Collectors.groupingBy(
                m -> m.getCategory() == null ? "Uncategorised" : m.getCategory().getName(),
                Collectors.summingLong(m -> m.getQuantity() == null ? 0 : m.getQuantity())));

        Map<String, Long> medicinesBySupplier = all.stream().collect(Collectors.groupingBy(
                m -> m.getSupplier() == null ? "Unknown" : m.getSupplier().getName(),
                Collectors.counting()));

        List<String> recentActivity = stockMovementRepository.findTop50ByOrderByCreatedAtDesc()
                .stream().limit(8)
                .map(sm -> sm.getType() + " " + sm.getQuantity() + " x "
                        + (sm.getMedicine() == null ? "?" : sm.getMedicine().getName())
                        + " by " + sm.getPerformedBy())
                .toList();

        return DashboardStats.builder()
                .totalMedicines(all.size())
                .totalSuppliers(supplierRepository.count())
                .totalUsers(userRepository.count())
                .lowStockCount(medicineService.lowStock().size())
                .outOfStockCount(medicineService.outOfStock().size())
                .nearExpiryCount(medicineService.nearExpiry().size())
                .expiredCount(medicineService.expired().size())
                .inventoryValue(medicineRepository.totalInventoryValue())
                .totalPurchaseCost(purchaseRepository.totalPurchaseCost())
                .stockByCategory(stockByCategory)
                .medicinesBySupplier(medicinesBySupplier)
                .recentActivity(recentActivity)
                .build();
    }
}
