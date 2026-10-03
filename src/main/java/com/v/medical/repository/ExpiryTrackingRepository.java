package com.v.medical.repository;

import com.v.medical.entity.ExpiryStatus;
import com.v.medical.entity.ExpiryTracking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ExpiryTrackingRepository
        extends JpaRepository<ExpiryTracking, Long> {

    List<ExpiryTracking>
    findByStatus(ExpiryStatus status);

    List<ExpiryTracking>
    findByMedicineId(Long medicineId);

    List<ExpiryTracking>
    findByBatchId(Long batchId);

    List<ExpiryTracking>
    findByExpiryDateBetween(
            LocalDate startDate,
            LocalDate endDate
    );

    List<ExpiryTracking>
    findByLocationIgnoreCase(String location);

    List<ExpiryTracking>
    findByAlertSent(boolean alertSent);

    List<ExpiryTracking>
    findByExpiryDateLessThan(
            LocalDate date
    );

    List<ExpiryTracking>
    findByExpiryDateGreaterThanEqualAndExpiryDateLessThanEqual(
            LocalDate startDate,
            LocalDate endDate
    );

    List<ExpiryTracking>
    findByMedicineNameContainingIgnoreCase(
            String name
    );
}