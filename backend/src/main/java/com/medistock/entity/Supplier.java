package com.medistock.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

/** Company or person who supplies medicines. */
@Entity
@Table(name = "suppliers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 20)
    private String contactNumber;

    @Email
    @Column(length = 150)
    private String email;

    @Column(length = 255)
    private String address;

    /** Simple 1-5 rating used in supplier analytics. */
    private Integer rating = 5;

    private LocalDateTime createdAt = LocalDateTime.now();
}
