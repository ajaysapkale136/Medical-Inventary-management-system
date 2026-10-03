package com.v.medical.controller;

import com.v.medical.Service.UserService;
import com.v.medical.entity.Role;
import com.v.medical.entity.User;
import com.v.medical.entity.UserStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final String adminBootstrapToken;

    public AuthController(
            UserService userService,
            @Value("${app.auth.admin-bootstrap-token:}") String adminBootstrapToken) {
        this.userService = userService;
        this.adminBootstrapToken = adminBootstrapToken;
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(
            @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {

        Role role = parseRole(request.role());
        if (role == Role.ADMIN && (adminBootstrapToken.isBlank()
                || !adminBootstrapToken.equals(request.securityToken()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Admin registration requires the configured bootstrap token");
        }

        User user = new User();
        user.setName(required(request.name(), "Name"));
        user.setEmail(required(request.email(), "Email"));
        user.setPassword(required(request.password(), "Password"));
        user.setRole(role);
        user.setPhone(blankToNull(request.phone()));
        user.setDepartment(blankToNull(request.department()));
        user.setLocation(blankToNull(request.location()));

        User created = userService.createUser(user);
        establishSession(httpRequest, created);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/login")
    public ResponseEntity<User> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        User user;
        try {
            user = userService.getUserByEmail(required(request.email(), "Email"));
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Incorrect email or password");
        }

        if (!userService.passwordMatches(user, request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Incorrect email or password");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This user account is not active");
        }

        if (!user.getPassword().startsWith("pbkdf2$")) {
            userService.upgradePassword(user, request.password());
        }
        userService.updateLastLogin(user.getId());
        establishSession(httpRequest, user);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/me")
    public ResponseEntity<User> me(HttpServletRequest request) {
        return ResponseEntity.ok(currentUser(request));
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(HttpServletRequest request) {
        return ResponseEntity.ok(currentUser(request));
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(
            @RequestBody ProfileRequest request,
            HttpServletRequest httpRequest) {

        User current = currentUser(httpRequest);
        User update = new User();
        update.setName(request.name());
        update.setPhone(request.phone());
        update.setDepartment(request.department());
        update.setLocation(request.location());

        return ResponseEntity.ok(userService.updateProfile(current.getId(), update));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            HttpServletRequest request,
            HttpServletResponse response) {

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok(Map.of("message", "Signed out"));
    }

    private void establishSession(HttpServletRequest request, User user) {
        HttpSession session = request.getSession(true);
        session.setAttribute("userId", user.getId());
        session.setAttribute("role", user.getRole());
    }

    private User currentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Please sign in to continue");
        }
        return userService.getUserById((Long) session.getAttribute("userId"));
    }

    private Role parseRole(String value) {
        try {
            return Role.valueOf(required(value, "Role").trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown user role");
        }
    }

    private String required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    field + " is required");
        }
        return value.trim();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record LoginRequest(String email, String password) { }

    public record RegisterRequest(
            String name,
            String email,
            String password,
            String role,
            String phone,
            String department,
            String location,
            String securityToken) { }

    public record ProfileRequest(
            String name,
            String phone,
            String department,
            String location) { }
}
