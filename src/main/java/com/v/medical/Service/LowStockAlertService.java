package com.v.medical.Service;

import com.v.medical.entity.*;
import com.v.medical.repository.LowStockAlertRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class LowStockAlertService {

    private final LowStockAlertRepository alertRepository;

    private final NotificationService notificationService;

    public LowStockAlertService(
            LowStockAlertRepository alertRepository,
            NotificationService notificationService) {

        this.alertRepository = alertRepository;
        this.notificationService =
                notificationService;
    }

    // ==========================================
    // GET ALL
    // ==========================================

    public List<LowStockAlert> getAll() {

        List<LowStockAlert> alerts =
                alertRepository.findAll();

        for (LowStockAlert alert : alerts) {
            alert.calculateStatus();
        }

        return alerts;
    }

    // ==========================================
    // GET BY ID
    // ==========================================

    public LowStockAlert getById(Long id) {

        return alertRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Low stock alert not found: "
                                        + id
                        ));
    }

    // ==========================================
    // CREATE / CHECK
    // ==========================================

    @Transactional
    public LowStockAlert checkStock(
            Medicine medicine,
            Integer currentStock,
            Integer reorderLevel,
            Integer reorderQuantity) {

        if (currentStock == null ||
                currentStock < 0) {

            throw new RuntimeException(
                    "Current stock cannot be negative"
            );
        }

        if (reorderLevel == null ||
                reorderLevel < 0) {

            throw new RuntimeException(
                    "Reorder level cannot be negative"
            );
        }

        LowStockAlert alert =
                alertRepository
                        .findByMedicineIdAndStatus(
                                medicine.getId(),
                                StockAlertStatus.NORMAL
                        )
                        .orElse(null);

        if (alert == null) {

            alert = new LowStockAlert();

            alert.setMedicine(medicine);
        }

        alert.setCurrentStock(currentStock);

        alert.setReorderLevel(reorderLevel);

        alert.setReorderQuantity(
                reorderQuantity == null
                        ? reorderLevel * 2
                        : reorderQuantity
        );

        alert.calculateStatus();

        LowStockAlert saved =
                alertRepository.save(alert);

        // Create notification only when stock
        // actually requires attention.

        if (saved.getStatus() ==
                    StockAlertStatus.WARNING ||
            saved.getStatus() ==
                    StockAlertStatus.CRITICAL ||
            saved.getStatus() ==
                    StockAlertStatus.OUT_OF_STOCK) {

            createNotification(saved);
        }

        return saved;
    }

    // ==========================================
    // NOTIFICATION
    // ==========================================

    private void createNotification(
            LowStockAlert alert) {

        if (alert.isNotificationSent()) {
            return;
        }

        Notification notification =
                new Notification();

        notification.setTitle(
                getNotificationTitle(
                        alert.getStatus()
                )
        );

        notification.setMessage(
                "Medicine stock is below the configured reorder level."
        );

        notification.setDescription(
                "Current stock: "
                        + alert.getCurrentStock()
                        + ", Reorder level: "
                        + alert.getReorderLevel()
        );

        notification.setType(
                alert.getStatus() ==
                        StockAlertStatus.OUT_OF_STOCK
                        ? NotificationType.OUT_OF_STOCK
                        : NotificationType.LOW_STOCK
        );

        notification.setPriority(
                alert.getStatus() ==
                        StockAlertStatus.WARNING
                        ? NotificationPriority.WARNING
                        : NotificationPriority.CRITICAL
        );

        notification.setStatus(
                NotificationStatus.NEW
        );

        notification.setChannel(
                NotificationChannel.IN_APP
        );

        notification.setMedicine(
                alert.getMedicine()
        );

        notification.setSuggestedAction(
                "Create a purchase order for "
                        + "the affected medicine."
        );

        notificationService
                .createNotification(
                        notification
                );

        alert.setNotificationSent(true);

        alert.setNotificationSentAt(
                LocalDateTime.now()
        );

        alertRepository.save(alert);
    }

    private String getNotificationTitle(
            StockAlertStatus status) {

        return switch (status) {

            case OUT_OF_STOCK ->
                    "Medicine Out of Stock";

            case CRITICAL ->
                    "Critical Low Stock";

            case WARNING ->
                    "Low Stock Warning";

            default ->
                    "Stock Alert";
        };
    }

    // ==========================================
    // WARNING
    // ==========================================

    public List<LowStockAlert>
    getWarnings() {

        return alertRepository
                .findByStatus(
                        StockAlertStatus.WARNING
                );
    }

    // ==========================================
    // CRITICAL
    // ==========================================

    public List<LowStockAlert>
    getCritical() {

        return alertRepository
                .findByStatus(
                        StockAlertStatus.CRITICAL
                );
    }

    // ==========================================
    // OUT OF STOCK
    // ==========================================

    public List<LowStockAlert>
    getOutOfStock() {

        return alertRepository
                .findByStatus(
                        StockAlertStatus.OUT_OF_STOCK
                );
    }

    // ==========================================
    // MEDICINE
    // ==========================================

    public List<LowStockAlert>
    getMedicineAlerts(Long medicineId) {

        return alertRepository
                .findByMedicineId(medicineId);
    }

    // ==========================================
    // SUMMARY
    // ==========================================

    public Map<String, Long>
    getSummary() {

        long total =
                alertRepository.count();

        long warning =
                alertRepository.countByStatus(
                        StockAlertStatus.WARNING
                );

        long critical =
                alertRepository.countByStatus(
                        StockAlertStatus.CRITICAL
                );

        long outOfStock =
                alertRepository.countByStatus(
                        StockAlertStatus.OUT_OF_STOCK
                );

        long resolved =
                alertRepository.countByStatus(
                        StockAlertStatus.RESOLVED
                );

        return Map.of(
                "totalAlerts", total,
                "warning", warning,
                "critical", critical,
                "outOfStock", outOfStock,
                "resolved", resolved
        );
    }

    // ==========================================
    // RESOLVE
    // ==========================================

    @Transactional
    public LowStockAlert resolve(
            Long id,
            String note) {

        LowStockAlert alert =
                getById(id);

        alert.setStatus(
                StockAlertStatus.RESOLVED
        );

        alert.setResolutionNote(note);

        alert.setNotificationSent(true);

        return alertRepository.save(alert);
    }

    // ==========================================
    // DELETE
    // ==========================================

    @Transactional
    public void delete(Long id) {

        LowStockAlert alert =
                getById(id);

        alertRepository.delete(alert);
    }
}