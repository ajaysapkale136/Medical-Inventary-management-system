package com.medistock.repository;

import com.medistock.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findBySupplierId(Long supplierId);

    @Query("SELECT COALESCE(SUM(p.totalCost), 0) FROM Purchase p")
    java.math.BigDecimal totalPurchaseCost();
}
