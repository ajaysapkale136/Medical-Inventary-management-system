package com.v.medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "purchase_order_items")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PurchaseOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "purchase_order_id",
            nullable = false
    )
    @JsonIgnore
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(
            name = "medicine_id",
            nullable = false
    )
    private Medicine medicine;

    @Column(nullable = false)
    private Integer orderedQuantity;

    @Column(nullable = false)
    private Integer receivedQuantity = 0;

    @Column(
            precision = 10,
            scale = 2,
            nullable = false
    )
    private BigDecimal unitPrice;

    @Column(
            precision = 10,
            scale = 2
    )
    private BigDecimal tax = BigDecimal.ZERO;

    @Column(
            precision = 10,
            scale = 2
    )
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(
            precision = 12,
            scale = 2
    )
    private BigDecimal totalPrice =
            BigDecimal.ZERO;

    @Column(length = 100)
    private String batchNumber;

    public PurchaseOrderItem() {
    }

    public Long getId() {
        return id;
    }

    public PurchaseOrder getPurchaseOrder() {
        return purchaseOrder;
    }

    public void setPurchaseOrder(
            PurchaseOrder purchaseOrder) {

        this.purchaseOrder =
                purchaseOrder;
    }

    public Medicine getMedicine() {
        return medicine;
    }

    public void setMedicine(
            Medicine medicine) {

        this.medicine = medicine;
    }

    public Integer getOrderedQuantity() {
        return orderedQuantity;
    }

    public void setOrderedQuantity(
            Integer orderedQuantity) {

        this.orderedQuantity =
                orderedQuantity;
    }

    public Integer getReceivedQuantity() {
        return receivedQuantity;
    }

    public void setReceivedQuantity(
            Integer receivedQuantity) {

        this.receivedQuantity =
                receivedQuantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(
            BigDecimal unitPrice) {

        this.unitPrice = unitPrice;
    }

    public BigDecimal getTax() {
        return tax;
    }

    public void setTax(BigDecimal tax) {
        this.tax = tax;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public void setDiscount(
            BigDecimal discount) {

        this.discount = discount;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(
            BigDecimal totalPrice) {

        this.totalPrice =
                totalPrice;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(
            String batchNumber) {

        this.batchNumber =
                batchNumber;
    }
}