package com.v.medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "online_order_items")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class OnlineOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // ORDER
    // ==========================================

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "online_order_id",
            nullable = false
    )
    @JsonIgnore
    private OnlineOrder onlineOrder;

    // ==========================================
    // MEDICINE
    // ==========================================

    @ManyToOne(
            fetch = FetchType.EAGER,
            optional = true
    )
    @JoinColumn(
            name = "medicine_id",
            nullable = true
    )
    private Medicine medicine;

    // ==========================================
    // SNAPSHOT DATA
    // ==========================================

    @Column(nullable = false)
    private String medicineName;

    @Column(length = 100)
    private String batchNumber;

    // ==========================================
    // QUANTITY
    // ==========================================

    @Column(nullable = false)
    private Integer quantity;

    // ==========================================
    // PRICE
    // ==========================================

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal unitPrice;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal totalPrice;

    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public OnlineOrderItem() {
    }

    // ==========================================
    // GETTERS
    // ==========================================

    public Long getId() {
        return id;
    }

    public OnlineOrder getOnlineOrder() {
        return onlineOrder;
    }

    public Medicine getMedicine() {
        return medicine;
    }

    public String getMedicineName() {
        return medicineName;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    // ==========================================
    // SETTERS
    // ==========================================

    public void setOnlineOrder(
            OnlineOrder onlineOrder) {
        this.onlineOrder =
                onlineOrder;
    }

    public void setMedicine(
            Medicine medicine) {
        this.medicine = medicine;
    }

    public void setMedicineName(
            String medicineName) {
        this.medicineName =
                medicineName;
    }

    public void setBatchNumber(
            String batchNumber) {
        this.batchNumber =
                batchNumber;
    }

    public void setQuantity(
            Integer quantity) {
        this.quantity = quantity;
    }

    public void setUnitPrice(
            BigDecimal unitPrice) {
        this.unitPrice =
                unitPrice;
    }

    public void setTotalPrice(
            BigDecimal totalPrice) {
        this.totalPrice =
                totalPrice;
    }
}