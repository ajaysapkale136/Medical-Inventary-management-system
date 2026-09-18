package com.medistock.controller;

import com.medistock.dto.ApiMessage;
import com.medistock.dto.AuthDtos.*;
import com.medistock.entity.User;
import com.medistock.security.JwtUtil;
import com.medistock.service.NotificationService;
import com.medistock.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/** Public endpoints: login, forgot / reset password. */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;

    @Value("${medistock.frontend.url}")
    private String frontendUrl;

    /** POST /api/auth/login -> returns the JWT token + user info. */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userService.findByEmail(request.getEmail());
        user.setLastLoginAt(LocalDateTime.now());

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return ResponseEntity.ok(LoginResponse.builder()
                .token(token)
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .build());
    }

    /** POST /api/auth/forgot-password -> e-mails a reset link. */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiMessage> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String token = userService.createResetToken(request.getEmail());
        String link = frontendUrl + "/reset-password?token=" + token;

        notificationService.sendEmailTo(request.getEmail(), "MediStock password reset",
                "Click this link to reset your password (valid for 1 hour):\n" + link);

        // The token is returned only to keep local testing easy.
        return ResponseEntity.ok(new ApiMessage("Reset link sent. Test token: " + token));
    }

    /** POST /api/auth/reset-password -> sets the new password. */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiMessage> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(new ApiMessage("Password updated successfully"));
    }
}
