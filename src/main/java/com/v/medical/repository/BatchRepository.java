package com.v.medical.repository;

import com.v.medical.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BatchRepository
        extends JpaRepository<Batch, Long> {

    Optional<Batch> findByBatchNumber(String batchNumber);

    List<Batch> findByMedicineId(Long medicineId);

    List<Batch> findByActiveTrue();

    List<Batch> findByActiveFalse();

    List<Batch> findByExpiryDateBetween(
            LocalDate startDate,
            LocalDate endDate
    );

    List<Batch> findByExpiryDateBefore(
            LocalDate date
    );

    List<Batch> findByBatchNumberContainingIgnoreCase(
            String batchNumber
    );

    boolean existsByBatchNumber(String batchNumber);
}