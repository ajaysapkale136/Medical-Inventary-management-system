package com.v.medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "stock_logs")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StockLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Inventory record affected by this operation
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(
            name = "inventory_id",
            nullable = false
    )
    private Inventory inventory;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    // STOCK_IN, STOCK_OUT, ADJUSTMENT, etc.
    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 30
    )
    private StockOperation operation;

    // Quantity involved in the operation
    @Column(nullable = false)
    private Integer quantity;

    // Quantity before operation
    @Column(nullable = false)
    private Integer previousQuantity;

    // Quantity after operation
    @Column(nullable = false)
    private Integer newQuantity;

    // Reason for operation
    @Column(length = 255)
    private String reason;

    // PO number, sale number, transfer reference, etc.
    @Column(length = 100)
    private String referenceNumber;

    // Admin / Pharmacist / Staff
    @Column(length = 100)
    private String performedBy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // ==============================
    // CONSTRUCTOR
    // ==============================

    public StockLog() {
        this.createdAt = LocalDateTime.now();
    }

    // ==============================
    // GETTERS & SETTERS
    // ==============================

    public Long getId() {
        return id;
    }

    public Inventory getInventory() {
        return inventory;
    }

    public void setInventory(Inventory inventory) {
        this.inventory = inventory;
        if (inventory != null && inventory.getMedicine() != null) {
            this.medicine = inventory.getMedicine();
        }
    }

    public Medicine getMedicine() {
        return medicine;
    }

    public void setMedicine(Medicine medicine) {
        this.medicine = medicine;
    }

    public StockOperation getOperation() {
        return operation;
    }

    public void setOperation(StockOperation operation) {
        this.operation = operation;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getPreviousQuantity() {
        return previousQuantity;
    }

    public void setPreviousQuantity(Integer previousQuantity) {
        this.previousQuantity = previousQuantity;
    }

    public Integer getNewQuantity() {
        return newQuantity;
    }

    public void setNewQuantity(Integer newQuantity) {
        this.newQuantity = newQuantity;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}