package com.medistock.controller;

import com.medistock.dto.ApiMessage;
import com.medistock.dto.AuthDtos.*;
import com.medistock.entity.User;
import com.medistock.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** User management + profile. Protected by the role hierarchy. */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** Current logged-in user. */
    @GetMapping("/me")
    public ResponseEntity<User> me(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(userService.findByEmail(principal.getUsername()));
    }

    @PutMapping("/me")
    public ResponseEntity<User> updateProfile(@AuthenticationPrincipal UserDetails principal,
                                              @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(principal.getUsername(), request));
    }

    @PutMapping("/me/password")
    public ResponseEntity<ApiMessage> changePassword(@AuthenticationPrincipal UserDetails principal,
                                                     @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(principal.getUsername(), request);
        return ResponseEntity.ok(new ApiMessage("Password changed successfully"));
    }

    /** Admin & Pharmacist can see the user list. */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<List<User>> all() {
        return ResponseEntity.ok(userService.findAll());
    }

    /**
     * Create a user.
     * Admin -> PHARMACIST, STAFF or SUPPLIER; Pharmacist -> STAFF only; nobody -> ADMIN.
     * The final check lives in UserService.createUser().
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<User> create(@AuthenticationPrincipal UserDetails principal,
                                       @Valid @RequestBody CreateUserRequest request) {
        User creator = userService.findByEmail(principal.getUsername());
        return ResponseEntity.ok(userService.createUser(request, creator));
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiMessage> toggleActive(@PathVariable Long id) {
        userService.toggleActive(id);
        return ResponseEntity.ok(new ApiMessage("User status updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiMessage> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.ok(new ApiMessage("User deleted"));
    }
}
