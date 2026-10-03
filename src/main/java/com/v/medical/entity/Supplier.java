package com.v.medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "suppliers")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // BASIC INFORMATION
    // ==========================================

    @Column(nullable = false, length = 200)
    private String companyName;

    @Column(length = 150)
    private String contactPerson;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(length = 100)
    private String supplierType;

    // ==========================================
    // ADDRESS
    // ==========================================

    @Column(length = 500)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 20)
    private String postalCode;

    // ==========================================
    // TAX / GST
    // ==========================================

    @Column(length = 50)
    private String gstNumber;

    @Column(length = 50)
    private String taxNumber;

    // ==========================================
    // BANK
    // ==========================================

    @Column(length = 150)
    private String bankName;

    @Column(length = 100)
    private String accountNumber;

    @Column(length = 30)
    private String ifscCode;

    // ==========================================
    // PAYMENT
    // ==========================================

    @Column(
            precision = 12,
            scale = 2
    )
    private BigDecimal creditLimit =
            BigDecimal.ZERO;

    @Column(
            precision = 12,
            scale = 2
    )
    private BigDecimal outstandingBalance =
            BigDecimal.ZERO;

    @Column(length = 50)
    private String paymentTerms;

    // ==========================================
    // STATUS
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SupplierStatus status =
            SupplierStatus.ACTIVE;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    // ==========================================
    // PERFORMANCE
    // ==========================================

    @Column(
            precision = 5,
            scale = 2
    )
    private BigDecimal onTimeDeliveryRate =
            BigDecimal.ZERO;

    @Column(
            precision = 5,
            scale = 2
    )
    private BigDecimal returnRate =
            BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer totalOrders = 0;

    @Column(
            precision = 14,
            scale = 2
    )
    private BigDecimal totalPurchaseAmount =
            BigDecimal.ZERO;

    // ==========================================
    // AUDIT
    // ==========================================

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public Supplier() {

        this.createdAt =
                LocalDateTime.now();

        this.updatedAt =
                LocalDateTime.now();
    }

    // ==========================================
    // GETTERS
    // ==========================================

    public Long getId() {
        return id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public String getSupplierType() {
        return supplierType;
    }

    public String getAddress() {
        return address;
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

    public String getGstNumber() {
        return gstNumber;
    }

    public String getTaxNumber() {
        return taxNumber;
    }

    public String getBankName() {
        return bankName;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public String getIfscCode() {
        return ifscCode;
    }

    public BigDecimal getCreditLimit() {
        return creditLimit;
    }

    public BigDecimal getOutstandingBalance() {
        return outstandingBalance;
    }

    public String getPaymentTerms() {
        return paymentTerms;
    }

    public SupplierStatus getStatus() {
        return status;
    }

    public BigDecimal getOnTimeDeliveryRate() {
        return onTimeDeliveryRate;
    }

    public BigDecimal getReturnRate() {
        return returnRate;
    }

    public Integer getTotalOrders() {
        return totalOrders;
    }

    public BigDecimal getTotalPurchaseAmount() {
        return totalPurchaseAmount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    // ==========================================
    // SETTERS
    // ==========================================

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setSupplierType(String supplierType) {
        this.supplierType = supplierType;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public void setState(String state) {
        this.state = state;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public void setGstNumber(String gstNumber) {
        this.gstNumber = gstNumber;
    }

    public void setTaxNumber(String taxNumber) {
        this.taxNumber = taxNumber;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public void setIfscCode(String ifscCode) {
        this.ifscCode = ifscCode;
    }

    public void setCreditLimit(BigDecimal creditLimit) {
        this.creditLimit = creditLimit;
    }

    public void setOutstandingBalance(
            BigDecimal outstandingBalance) {

        this.outstandingBalance =
                outstandingBalance;
    }

    public void setPaymentTerms(String paymentTerms) {
        this.paymentTerms = paymentTerms;
    }

    public void setStatus(SupplierStatus status) {
        this.status = status;
    }

    public void setOnTimeDeliveryRate(
            BigDecimal onTimeDeliveryRate) {

        this.onTimeDeliveryRate =
                onTimeDeliveryRate;
    }

    public void setReturnRate(
            BigDecimal returnRate) {

        this.returnRate =
                returnRate;
    }

    public void setTotalOrders(Integer totalOrders) {
        this.totalOrders = totalOrders;
    }

    public void setTotalPurchaseAmount(
            BigDecimal totalPurchaseAmount) {

        this.totalPurchaseAmount =
                totalPurchaseAmount;
    }

    public void setUpdatedAt(
            LocalDateTime updatedAt) {

        this.updatedAt = updatedAt;
    }

    public String getName() {
        return companyName;
    }
}