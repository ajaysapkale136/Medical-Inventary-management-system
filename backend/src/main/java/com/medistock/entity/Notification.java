package com.medistock.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** In-app notification (low stock, expiry, purchase). */
@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    public enum NotificationType { LOW_STOCK, OUT_OF_STOCK, NEAR_EXPIRY, EXPIRED, PURCHASE, SYSTEM }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationType type;

    @Column(nullable = false, length = 255)
    private String message;

    @Column(nullable = false)
    private boolean readFlag = false;

    private LocalDateTime createdAt = LocalDateTime.now();
}
