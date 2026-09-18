package com.medistock.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** A medicine batch held in inventory. */
@Entity
@Table(name = "medicines")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String name;

    @NotBlank
    @Column(nullable = false, length = 60)
    private String batchNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Min(0)
    @Column(nullable = false)
    private Integer quantity = 0;

    /** Quantity under which the medicine is considered "low stock". */
    @Min(0)
    private Integer lowStockThreshold = 20;

    private LocalDate manufacturingDate;

    @NotNull
    private LocalDate expiryDate;

    @DecimalMin("0.0")
    @Column(precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    /* ---------- Helper methods used by dashboards ---------- */

    @Transient
    public boolean isExpired() {
        return expiryDate != null && expiryDate.isBefore(LocalDate.now());
    }

    @Transient
    public boolean isLowStock() {
        return quantity != null && quantity > 0 && quantity <= lowStockThreshold;
    }

    @Transient
    public boolean isOutOfStock() {
        return quantity == null || quantity == 0;
    }
}
