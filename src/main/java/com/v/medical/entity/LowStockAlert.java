package com.v.medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "low_stock_alerts")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class LowStockAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==============================
    // MEDICINE
    // ==============================

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    // ==============================
    // CURRENT STOCK
    // ==============================

    @Column(nullable = false)
    private Integer currentStock = 0;

    // ==============================
    // REORDER LEVEL
    // ==============================

    @Column(nullable = false)
    private Integer reorderLevel = 0;

    // ==============================
    // REORDER QUANTITY
    // ==============================

    @Column(nullable = false)
    private Integer reorderQuantity = 0;

    // ==============================
    // STATUS
    // ==============================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StockAlertStatus status =
            StockAlertStatus.NORMAL;

    // ==============================
    // ALERT
    // ==============================

    @Column(nullable = false)
    private boolean notificationSent = false;

    private LocalDateTime notificationSentAt;

    // ==============================
    // RESOLUTION
    // ==============================

    private LocalDateTime resolvedAt;

    @Column(length = 500)
    private String resolutionNote;

    // ==============================
    // AUDIT
    // ==============================

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // ==============================
    // CONSTRUCTOR
    // ==============================

    public LowStockAlert() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // ==============================
    // STATUS CALCULATION
    // ==============================

    public void calculateStatus() {

        if (currentStock == null ||
                currentStock <= 0) {

            status = StockAlertStatus.OUT_OF_STOCK;

        } else if (currentStock <=
                reorderLevel / 2) {

            status = StockAlertStatus.CRITICAL;

        } else if (currentStock <=
                reorderLevel) {

            status = StockAlertStatus.WARNING;

        } else {

            status = StockAlertStatus.NORMAL;
        }

        updatedAt = LocalDateTime.now();
    }

    // ==============================
    // GETTERS / SETTERS
    // ==============================

    public Long getId() {
        return id;
    }

    public Medicine getMedicine() {
        return medicine;
    }

    public void setMedicine(Medicine medicine) {
        this.medicine = medicine;
    }

    public Integer getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(Integer currentStock) {
        this.currentStock = currentStock;
    }

    public Integer getReorderLevel() {
        return reorderLevel;
    }

    public void setReorderLevel(Integer reorderLevel) {
        this.reorderLevel = reorderLevel;
    }

    public Integer getReorderQuantity() {
        return reorderQuantity;
    }

    public void setReorderQuantity(Integer reorderQuantity) {
        this.reorderQuantity = reorderQuantity;
    }

    public StockAlertStatus getStatus() {
        return status;
    }

    public void setStatus(StockAlertStatus status) {
        this.status = status;
    }

    public boolean isNotificationSent() {
        return notificationSent;
    }

    public void setNotificationSent(
            boolean notificationSent) {

        this.notificationSent = notificationSent;
    }

    public LocalDateTime getNotificationSentAt() {
        return notificationSentAt;
    }

    public void setNotificationSentAt(
            LocalDateTime notificationSentAt) {

        this.notificationSentAt =
                notificationSentAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public void setResolutionNote(
            String resolutionNote) {

        this.resolutionNote =
                resolutionNote;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}