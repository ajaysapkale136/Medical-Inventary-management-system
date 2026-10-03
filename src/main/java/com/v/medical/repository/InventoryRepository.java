package com.v.medical.repository;

import com.v.medical.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventoryRepository
        extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByMedicineId(
            Long medicineId
    );

    Optional<Inventory> findByBatchId(
            Long batchId
    );

    Optional<Inventory> findByMedicineIdAndBatchId(
            Long medicineId,
            Long batchId
    );

    List<Inventory> findByQuantityLessThanEqual(
            Integer reorderLevel
    );

    List<Inventory> findByQuantity(Integer quantity);

    List<Inventory> findByLocationIgnoreCase(
            String location
    );

    List<Inventory> findByActiveTrue();

    List<Inventory>
    findByMedicine_NameContainingIgnoreCase(
            String name
    );
}