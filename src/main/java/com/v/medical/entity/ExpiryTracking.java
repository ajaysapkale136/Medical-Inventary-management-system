package com.v.medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "expiry_tracking")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ExpiryTracking {

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
    // BATCH
    // ==============================

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    // ==============================
    // EXPIRY DATE
    // ==============================

    @Column(nullable = false)
    private LocalDate expiryDate;

    // ==============================
    // MANUFACTURING DATE
    // ==============================

    private LocalDate manufacturingDate;

    // ==============================
    // STOCK
    // ==============================

    @Column(nullable = false)
    private Integer stockQuantity = 0;

    // ==============================
    // LOCATION
    // ==============================

    @Column(length = 150)
    private String location;

    // ==============================
    // ALERT CONFIGURATION
    // ==============================

    @Column(nullable = false)
    private Integer alertDays = 30;

    // ==============================
    // STATUS
    // ==============================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ExpiryStatus status = ExpiryStatus.SAFE;

    // ==============================
    // NOTIFICATION
    // ==============================

    @Column(nullable = false)
    private boolean alertSent = false;

    private java.time.LocalDateTime alertSentAt;

    // ==============================
    // DISPOSAL
    // ==============================

    @Column(nullable = false)
    private boolean disposed = false;

    private java.time.LocalDateTime disposedAt;

    @Column(length = 500)
    private String disposalReason;

    // ==============================
    // CONSTRUCTOR
    // ==============================

    public ExpiryTracking() {
    }

    // ==============================
    // CALCULATE DAYS LEFT
    // ==============================

    @Transient
    public long getDaysLeft() {

        if (expiryDate == null) {
            return 0;
        }

        return ChronoUnit.DAYS.between(
                LocalDate.now(),
                expiryDate
        );
    }

    // ==============================
    // CALCULATE STATUS
    // ==============================

    public void calculateStatus() {

        if (disposed) {
            status = ExpiryStatus.DISPOSED;
            return;
        }

        if (expiryDate == null) {
            status = ExpiryStatus.SAFE;
            return;
        }

        long daysLeft = getDaysLeft();

        if (daysLeft < 0) {

            status = ExpiryStatus.EXPIRED;

        } else if (daysLeft <= alertDays) {

            status = ExpiryStatus.NEAR_EXPIRY;

        } else {

            status = ExpiryStatus.SAFE;
        }
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

    public Batch getBatch() {
        return batch;
    }

    public void setBatch(Batch batch) {
        this.batch = batch;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public LocalDate getManufacturingDate() {
        return manufacturingDate;
    }

    public void setManufacturingDate(
            LocalDate manufacturingDate) {

        this.manufacturingDate =
                manufacturingDate;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(
            Integer stockQuantity) {

        this.stockQuantity = stockQuantity;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Integer getAlertDays() {
        return alertDays;
    }

    public void setAlertDays(Integer alertDays) {
        this.alertDays = alertDays;
    }

    public ExpiryStatus getStatus() {
        return status;
    }

    public void setStatus(ExpiryStatus status) {
        this.status = status;
    }

    public boolean isAlertSent() {
        return alertSent;
    }

    public void setAlertSent(boolean alertSent) {
        this.alertSent = alertSent;
    }

    public java.time.LocalDateTime getAlertSentAt() {
        return alertSentAt;
    }

    public void setAlertSentAt(
            java.time.LocalDateTime alertSentAt) {

        this.alertSentAt = alertSentAt;
    }

    public boolean isDisposed() {
        return disposed;
    }

    public void setDisposed(boolean disposed) {
        this.disposed = disposed;
    }

    public java.time.LocalDateTime getDisposedAt() {
        return disposedAt;
    }

    public void setDisposedAt(
            java.time.LocalDateTime disposedAt) {

        this.disposedAt = disposedAt;
    }

    public String getDisposalReason() {
        return disposalReason;
    }

    public void setDisposalReason(
            String disposalReason) {

        this.disposalReason =
                disposalReason;
    }
}