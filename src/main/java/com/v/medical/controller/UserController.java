package com.v.medical.controller;

import com.v.medical.entity.User;
import com.v.medical.entity.Role;
import com.v.medical.entity.UserStatus;
import com.v.medical.Service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ==============================
    // ALL USERS
    // ==============================

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {

        return ResponseEntity.ok(
                userService.getAllUsers()
        );
    }

    // ==============================
    // USER BY ID
    // ==============================

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                userService.getUserById(id)
        );
    }

    // ==============================
    // CREATE
    // ==============================

    @PostMapping
    public ResponseEntity<User> createUser(
            @RequestBody Map<String, Object> body) {

        User user =
                new User();

        user.setName(
                body.get("name").toString()
        );

        user.setEmail(
                body.get("email").toString()
        );

        user.setPhone(
                getString(body, "phone")
        );

        user.setPassword(
                body.get("password").toString()
        );

        user.setDepartment(
                getString(body, "department")
        );

        user.setLocation(
                getString(body, "location")
        );

        user.setRole(getRole(body));

        return ResponseEntity.ok(
                userService.createUser(user)
        );
    }

    // ==============================
    // UPDATE
    // ==============================

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        User user =
                new User();

        user.setName(
                getString(body, "name")
        );

        user.setEmail(
                getString(body, "email")
        );

        user.setPhone(
                getString(body, "phone")
        );

        user.setDepartment(
                getString(body, "department")
        );

        user.setLocation(
                getString(body, "location")
        );

        user.setRole(getRole(body));

        return ResponseEntity.ok(
                userService.updateUser(id, user)
        );
    }

    // ==============================
    // SEARCH
    // ==============================

    @GetMapping("/search")
    public ResponseEntity<List<User>> search(
            @RequestParam String keyword) {

        return ResponseEntity.ok(
                userService.searchUsers(
                        keyword
                )
        );
    }

    // ==============================
    // ROLE FILTER
    // ==============================

    @GetMapping("/role/{role}")
    public ResponseEntity<List<User>> byRole(
            @PathVariable String role) {

        return ResponseEntity.ok(
                userService.getUsersByRole(
                        Role.valueOf(role.trim().toUpperCase())
                )
        );
    }

    // ==============================
    // STATUS FILTER
    // ==============================

    @GetMapping("/status/{status}")
    public ResponseEntity<List<User>> byStatus(
            @PathVariable UserStatus status) {

        return ResponseEntity.ok(
                userService.getUsersByStatus(
                        status
                )
        );
    }

    // ==============================
    // LOCATION FILTER
    // ==============================

    @GetMapping("/location/{location}")
    public ResponseEntity<List<User>> byLocation(
            @PathVariable String location) {

        return ResponseEntity.ok(
                userService.getUsersByLocation(
                        location
                )
        );
    }

    // ==============================
    // DEPARTMENT FILTER
    // ==============================

    @GetMapping("/department/{department}")
    public ResponseEntity<List<User>> byDepartment(
            @PathVariable String department) {

        return ResponseEntity.ok(
                userService.getUsersByDepartment(
                        department
                )
        );
    }

    // ==============================
    // SUMMARY
    // ==============================

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Long>>
    getSummary() {

        return ResponseEntity.ok(
                userService.getUserSummary()
        );
    }

    // ==============================
    // ACTIVATE
    // ==============================

    @PatchMapping("/{id}/activate")
    public ResponseEntity<User> activate(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                userService.activateUser(id)
        );
    }

    // ==============================
    // DEACTIVATE
    // ==============================

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<User> deactivate(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                userService.deactivateUser(id)
        );
    }

    // ==============================
    // BLOCK
    // ==============================

    @PatchMapping("/{id}/block")
    public ResponseEntity<User> block(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                userService.blockUser(id)
        );
    }

    // ==============================
    // UNBLOCK
    // ==============================

    @PatchMapping("/{id}/unblock")
    public ResponseEntity<User> unblock(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                userService.unblockUser(id)
        );
    }

    // ==============================
    // LAST LOGIN
    // ==============================

    @PatchMapping("/{id}/last-login")
    public ResponseEntity<User> updateLastLogin(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                userService.updateLastLogin(id)
        );
    }

    // ==============================
    // DELETE
    // ==============================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        userService.deleteUser(id);

        return ResponseEntity.noContent()
                .build();
    }

    // ==============================
    // HELPER
    // ==============================

    private String getString(
            Map<String, Object> body,
            String key) {

        Object value = body.get(key);

        return value == null
                ? null
                : value.toString();
    }

    private Role getRole(Map<String, Object> body) {

        Object role = body.get("role");

        if (role == null) {
            return null;
        }

        return Role.valueOf(role.toString().trim().toUpperCase());
    }
}
