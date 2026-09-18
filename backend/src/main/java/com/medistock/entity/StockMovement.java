package com.medistock.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** History row written every time stock goes IN or OUT. */
@Entity
@Table(name = "stock_movements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StockMovement {

    public enum MovementType { IN, OUT, ADJUSTMENT }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MovementType type;

    @Column(nullable = false)
    private Integer quantity;

    /** Stock level after this movement (useful for reports). */
    private Integer resultingQuantity;

    @Column(length = 255)
    private String note;

    @Column(length = 150)
    private String performedBy;

    private LocalDateTime createdAt = LocalDateTime.now();
}
