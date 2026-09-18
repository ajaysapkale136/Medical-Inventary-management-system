package com.medistock.repository;

import com.medistock.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findTop50ByOrderByCreatedAtDesc();
    List<StockMovement> findByMedicineIdOrderByCreatedAtDesc(Long medicineId);
}
