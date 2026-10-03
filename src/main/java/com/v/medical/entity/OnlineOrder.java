package com.v.medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "online_orders")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class OnlineOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // ORDER NUMBER
    // ==========================================

    @Column(
            nullable = false,
            unique = true,
            length = 50
    )
    private String orderNumber;

    // ==========================================
    // CUSTOMER DETAILS
    // ==========================================

    @Column(nullable = false, length = 150)
    private String customerName;

    @Column(nullable = false, length = 150)
    private String customerEmail;

    @Column(nullable = false, length = 30)
    private String customerPhone;

    @Column(length = 500)
    private String deliveryAddress;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 20)
    private String postalCode;

    // ==========================================
    // ORDER ITEMS
    // ==========================================

    @OneToMany(
            mappedBy = "onlineOrder",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<OnlineOrderItem> items =
            new ArrayList<>();

    // ==========================================
    // AMOUNTS
    // ==========================================

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal subtotal =
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
    private BigDecimal tax =
            BigDecimal.ZERO;

    @Column(
            precision = 12,
            scale = 2
    )
    private BigDecimal deliveryCharge =
            BigDecimal.ZERO;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal totalAmount =
            BigDecimal.ZERO;

    // ==========================================
    // ORDER STATUS
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private OnlineOrderStatus status =
            OnlineOrderStatus.PENDING;

    // ==========================================
    // PAYMENT
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus paymentStatus =
            PaymentStatus.PENDING;

    @Column(length = 50)
    private String paymentMethod;

    @Column(length = 100)
    private String transactionId;

    // ==========================================
    // SOURCE PLATFORM
    // ==========================================

    @Column(length = 100)
    private String platformName;

    @Column(length = 150)
    private String platformOrderId;

    // ==========================================
    // NOTES
    // ==========================================

    @Column(length = 1000)
    private String customerNote;

    @Column(length = 1000)
    private String pharmacistNote;

    // ==========================================
    // DATES
    // ==========================================

    @Column(nullable = false)
    private LocalDateTime orderDate;

    private LocalDateTime confirmedAt;

    private LocalDateTime deliveredAt;

    private LocalDateTime cancelledAt;

    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public OnlineOrder() {

        this.orderDate =
                LocalDateTime.now();
    }

    // ==========================================
    // GETTERS
    // ==========================================

    public Long getId() {
        return id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public String getCity() {
        return city;
    }

    public String getState() {
        return state;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public List<OnlineOrderItem> getItems() {
        return items;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public BigDecimal getTax() {
        return tax;
    }

    public BigDecimal getDeliveryCharge() {
        return deliveryCharge;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public OnlineOrderStatus getStatus() {
        return status;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public String getPlatformName() {
        return platformName;
    }

    public String getPlatformOrderId() {
        return platformOrderId;
    }

    public String getCustomerNote() {
        return customerNote;
    }

    public String getPharmacistNote() {
        return pharmacistNote;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    // ==========================================
    // SETTERS
    // ==========================================

    public void setOrderNumber(
            String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public void setCustomerName(
            String customerName) {
        this.customerName = customerName;
    }

    public void setCustomerEmail(
            String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public void setCustomerPhone(
            String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public void setDeliveryAddress(
            String deliveryAddress) {
        this.deliveryAddress =
                deliveryAddress;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public void setState(String state) {
        this.state = state;
    }

    public void setPostalCode(
            String postalCode) {
        this.postalCode = postalCode;
    }

    public void setItems(
            List<OnlineOrderItem> items) {
        this.items = items;
    }

    public void setSubtotal(
            BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public void setDiscount(
            BigDecimal discount) {
        this.discount = discount;
    }

    public void setTax(
            BigDecimal tax) {
        this.tax = tax;
    }

    public void setDeliveryCharge(
            BigDecimal deliveryCharge) {
        this.deliveryCharge =
                deliveryCharge;
    }

    public void setTotalAmount(
            BigDecimal totalAmount) {
        this.totalAmount =
                totalAmount;
    }

    public void setStatus(
            OnlineOrderStatus status) {
        this.status = status;
    }

    public void setPaymentStatus(
            PaymentStatus paymentStatus) {
        this.paymentStatus =
                paymentStatus;
    }

    public void setPaymentMethod(
            String paymentMethod) {
        this.paymentMethod =
                paymentMethod;
    }

    public void setTransactionId(
            String transactionId) {
        this.transactionId =
                transactionId;
    }

    public void setPlatformName(
            String platformName) {
        this.platformName =
                platformName;
    }

    public void setPlatformOrderId(
            String platformOrderId) {
        this.platformOrderId =
                platformOrderId;
    }

    public void setCustomerNote(
            String customerNote) {
        this.customerNote =
                customerNote;
    }

    public void setPharmacistNote(
            String pharmacistNote) {
        this.pharmacistNote =
                pharmacistNote;
    }

    public void setOrderDate(
            LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public void setConfirmedAt(
            LocalDateTime confirmedAt) {
        this.confirmedAt =
                confirmedAt;
    }

    public void setDeliveredAt(
            LocalDateTime deliveredAt) {
        this.deliveredAt =
                deliveredAt;
    }

    public void setCancelledAt(
            LocalDateTime cancelledAt) {
        this.cancelledAt =
                cancelledAt;
    }

    // ==========================================
    // HELPER
    // ==========================================

    public void addItem(
            OnlineOrderItem item) {

        items.add(item);

        item.setOnlineOrder(this);
    }

    public void removeItem(
            OnlineOrderItem item) {

        items.remove(item);

        item.setOnlineOrder(null);
    }
}