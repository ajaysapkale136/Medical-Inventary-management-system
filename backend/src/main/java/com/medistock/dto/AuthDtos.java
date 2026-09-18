package com.medistock.dto;

import com.medistock.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/** All request/response objects used by the authentication endpoints. */
public class AuthDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        @Email @NotBlank private String email;
        @NotBlank private String password;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LoginResponse {
        private String token;
        private Long id;
        private String fullName;
        private String email;
        private Role role;
    }

    /** Used by Admin/Pharmacist to create a new user. */
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CreateUserRequest {
        @NotBlank private String fullName;
        @Email @NotBlank private String email;
        @NotBlank @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;
        private String phone;
        /** Admin may create PHARMACIST, STAFF or SUPPLIER; ADMIN is restricted to Admin creators. */
        private Role role;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class UpdateProfileRequest {
        private String fullName;
        private String phone;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ForgotPasswordRequest {
        @Email @NotBlank private String email;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ResetPasswordRequest {
        @NotBlank private String token;
        @NotBlank @Size(min = 6) private String newPassword;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank private String currentPassword;
        @NotBlank @Size(min = 6) private String newPassword;
    }
}
