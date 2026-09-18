package com.medistock.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/** A purchase order placed with a supplier. */
@Entity
@Table(name = "purchases")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    private Integer quantity;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalCost;

    private LocalDate purchaseDate = LocalDate.now();
}
