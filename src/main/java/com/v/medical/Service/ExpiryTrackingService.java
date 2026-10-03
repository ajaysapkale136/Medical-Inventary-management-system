package com.v.medical.Service;

import com.v.medical.entity.*;
import com.v.medical.repository.ExpiryTrackingRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class ExpiryTrackingService {

    private final ExpiryTrackingRepository
            expiryRepository;

    public ExpiryTrackingService(
            ExpiryTrackingRepository expiryRepository,
            NotificationService notificationService) {

        this.expiryRepository =
                expiryRepository;
    }

    // ==========================================
    // GET ALL
    // ==========================================

    public List<ExpiryTracking> getAll() {

        List<ExpiryTracking> records =
                expiryRepository.findAll();

        for (ExpiryTracking record : records) {
            record.calculateStatus();
        }

        return records;
    }

    // ==========================================
    // GET BY ID
    // ==========================================

    public ExpiryTracking getById(Long id) {

        ExpiryTracking record =
                expiryRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Expiry record not found: "
                                                + id
                                ));

        record.calculateStatus();

        return record;
    }

    // ==========================================
    // CREATE
    // ==========================================

    @Transactional
    public ExpiryTracking create(
            ExpiryTracking expiry) {

        validate(expiry);

        expiry.calculateStatus();

        return expiryRepository.save(expiry);
    }

    // ==========================================
    // UPDATE
    // ==========================================

    @Transactional
    public ExpiryTracking update(
            Long id,
            ExpiryTracking request) {

        ExpiryTracking existing =
                getById(id);

        existing.setExpiryDate(
                request.getExpiryDate()
        );

        existing.setManufacturingDate(
                request.getManufacturingDate()
        );

        existing.setStockQuantity(
                request.getStockQuantity()
        );

        existing.setLocation(
                request.getLocation()
        );

        existing.setAlertDays(
                request.getAlertDays()
        );

        existing.calculateStatus();

        return expiryRepository.save(
                existing
        );
    }

    // ==========================================
    // SEARCH
    // ==========================================

    public List<ExpiryTracking> search(
            String medicineName) {

        List<ExpiryTracking> records =
                expiryRepository
                        .findByMedicineNameContainingIgnoreCase(
                                medicineName
                        );

        for (ExpiryTracking record : records) {
            record.calculateStatus();
        }

        return records;
    }

    // ==========================================
    // STATUS FILTER
    // ==========================================

    public List<ExpiryTracking> getByStatus(
            ExpiryStatus status) {

        List<ExpiryTracking> records =
                expiryRepository
                        .findByStatus(status);

        for (ExpiryTracking record : records) {
            record.calculateStatus();
        }

        return records;
    }

    // ==========================================
    // NEAR EXPIRY
    // ==========================================

    public List<ExpiryTracking>
    getNearExpiry(Integer days) {

        LocalDate today =
                LocalDate.now();

        LocalDate future =
                today.plusDays(days);

        List<ExpiryTracking> records =
                expiryRepository
                        .findByExpiryDateGreaterThanEqualAndExpiryDateLessThanEqual(
                                today,
                                future
                        );

        for (ExpiryTracking record : records) {
            record.calculateStatus();
        }

        return records;
    }

    // ==========================================
    // EXPIRED
    // ==========================================

    public List<ExpiryTracking>
    getExpired() {

        List<ExpiryTracking> records =
                expiryRepository
                        .findByExpiryDateLessThan(
                                LocalDate.now()
                        );

        for (ExpiryTracking record : records) {
            record.calculateStatus();
        }

        return records;
    }

    // ==========================================
    // DATE RANGE
    // ==========================================

    public List<ExpiryTracking>
    getByDateRange(
            LocalDate from,
            LocalDate to) {

        List<ExpiryTracking> records =
                expiryRepository
                        .findByExpiryDateBetween(
                                from,
                                to
                        );

        for (ExpiryTracking record : records) {
            record.calculateStatus();
        }

        return records;
    }

    // ==========================================
    // SUMMARY / KPI
    // ==========================================

    public Map<String, Long>
    getSummary() {

        List<ExpiryTracking> all =
                getAll();

        long total =
                all.size();

        long nearExpiry =
                all.stream()
                        .filter(e ->
                                e.getStatus()
                                        == ExpiryStatus.NEAR_EXPIRY)
                        .count();

        long expired =
                all.stream()
                        .filter(e ->
                                e.getStatus()
                                        == ExpiryStatus.EXPIRED)
                        .count();

        long safe =
                all.stream()
                        .filter(e ->
                                e.getStatus()
                                        == ExpiryStatus.SAFE)
                        .count();

        long disposed =
                all.stream()
                        .filter(e ->
                                e.getStatus()
                                        == ExpiryStatus.DISPOSED)
                        .count();

        return Map.of(
                "totalMedicines", total,
                "nearExpiry", nearExpiry,
                "expiredMedicines", expired,
                "safeMedicines", safe,
                "disposedMedicines", disposed
        );
    }

    // ==========================================
    // MARK NOTIFIED
    // ==========================================

    @Transactional
    public ExpiryTracking markNotified(
            Long id) {

        ExpiryTracking expiry =
                getById(id);

        expiry.setAlertSent(true);

        expiry.setAlertSentAt(
                LocalDateTime.now()
        );

        return expiryRepository.save(
                expiry
        );
    }

    // ==========================================
    // DISPOSE
    // ==========================================

    @Transactional
    public ExpiryTracking dispose(
            Long id,
            String reason) {

        ExpiryTracking expiry =
                getById(id);

        expiry.setDisposed(true);

        expiry.setDisposedAt(
                LocalDateTime.now()
        );

        expiry.setDisposalReason(reason);

        expiry.setStatus(
                ExpiryStatus.DISPOSED
        );

        return expiryRepository.save(
                expiry
        );
    }

    // ==========================================
    // DELETE
    // ==========================================

    @Transactional
    public void delete(Long id) {

        ExpiryTracking expiry =
                getById(id);

        expiryRepository.delete(expiry);
    }

    // ==========================================
    // VALIDATION
    // ==========================================

    private void validate(
            ExpiryTracking expiry) {

        if (expiry.getMedicine() == null) {

            throw new RuntimeException(
                    "Medicine is required"
            );
        }

        if (expiry.getBatch() == null) {

            throw new RuntimeException(
                    "Batch is required"
            );
        }

        if (expiry.getExpiryDate() == null) {

            throw new RuntimeException(
                    "Expiry date is required"
            );
        }

        if (expiry.getStockQuantity() == null ||
                expiry.getStockQuantity() < 0) {

            throw new RuntimeException(
                    "Stock quantity cannot be negative"
            );
        }

        if (expiry.getAlertDays() == null ||
                expiry.getAlertDays() < 1) {

            expiry.setAlertDays(30);
        }
    }
}
