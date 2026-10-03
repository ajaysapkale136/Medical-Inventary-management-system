package com.v.medical.repository;

import com.v.medical.entity.LowStockAlert;
import com.v.medical.entity.StockAlertStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LowStockAlertRepository
        extends JpaRepository<LowStockAlert, Long> {

    List<LowStockAlert>
    findByStatus(StockAlertStatus status);

    List<LowStockAlert>
    findByMedicineId(Long medicineId);

    Optional<LowStockAlert>
    findByMedicineIdAndStatus(
            Long medicineId,
            StockAlertStatus status
    );

    List<LowStockAlert>
    findByNotificationSent(boolean sent);

    long countByStatus(
            StockAlertStatus status
    );
}