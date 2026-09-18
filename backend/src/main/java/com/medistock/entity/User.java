package com.medistock.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

/** Application user (Admin / Pharmacist / Staff). */
@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String fullName;

    @Email @NotBlank
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /** BCrypt hashed password. Null for users created through Google OAuth2. */
    @Column(length = 255)
    private String password;

    @Column(length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(nullable = false)
    private boolean active = true;

    /** "LOCAL" for email+password users, "GOOGLE" for OAuth2 users. */
    @Column(length = 20)
    private String provider = "LOCAL";

    /** Token used for the "forgot password" flow. */
    @Column(length = 100)
    private String resetToken;

    private LocalDateTime resetTokenExpiry;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime lastLoginAt;
}
