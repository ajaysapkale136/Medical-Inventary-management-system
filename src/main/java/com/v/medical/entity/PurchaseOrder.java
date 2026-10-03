package com.v.medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchase_orders")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            nullable = false,
            unique = true,
            length = 50
    )
    private String poNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(
            name = "supplier_id",
            nullable = false
    )
    private Supplier supplier;

    @Column(nullable = false)
    private LocalDate orderDate;

    private LocalDate expectedDate;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 30
    )
    private PurchaseOrderStatus status =
            PurchaseOrderStatus.DRAFT;

    @Column(
            precision = 12,
            scale = 2
    )
    private BigDecimal subtotal =
            BigDecimal.ZERO;

    @Column(
            precision = 12,
            scale = 2
    )
    private BigDecimal tax =
            BigDecimal.ZERO;

    @Column(
            precision = 12,
            scale = 2
    )
    private BigDecimal discount =
            BigDecimal.ZERO;

    @Column(
            precision = 12,
            scale = 2
    )
    private BigDecimal totalAmount =
            BigDecimal.ZERO;

    @Column(length = 30)
    private String paymentStatus = "PENDING";

    @Column(length = 30)
    private String receivingStatus = "PENDING";

    @Column(length = 100)
    private String createdBy;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(
            mappedBy = "purchaseOrder",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<PurchaseOrderItem> items =
            new ArrayList<>();

    public PurchaseOrder() {

        this.createdAt =
                LocalDateTime.now();

        this.orderDate =
                LocalDate.now();
    }

    public Long getId() {
        return id;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
    }

    public LocalDate getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDate orderDate) {
        this.orderDate = orderDate;
    }

    public LocalDate getExpectedDate() {
        return expectedDate;
    }

    public void setExpectedDate(LocalDate expectedDate) {
        this.expectedDate = expectedDate;
    }

    public PurchaseOrderStatus getStatus() {
        return status;
    }

    public void setStatus(PurchaseOrderStatus status) {
        this.status = status;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
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

    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getReceivingStatus() {
        return receivingStatus;
    }

    public void setReceivingStatus(String receivingStatus) {
        this.receivingStatus = receivingStatus;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<PurchaseOrderItem> getItems() {
        return items;
    }

    public void setItems(
            List<PurchaseOrderItem> items) {

        this.items = items;
    }

    @PreUpdate
    public void updateTimestamp() {

        this.updatedAt =
                LocalDateTime.now();
    }

    public void addItem(
            PurchaseOrderItem item) {

        items.add(item);

        item.setPurchaseOrder(this);
    }

    public void removeItem(
            PurchaseOrderItem item) {

        items.remove(item);

        item.setPurchaseOrder(null);
    }
}