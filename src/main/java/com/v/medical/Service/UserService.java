package com.v.medical.Service;

import com.v.medical.entity.Role;
import com.v.medical.entity.User;
import com.v.medical.entity.UserStatus;
import com.v.medical.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordService passwordService;

    public UserService(
            UserRepository userRepository,
            PasswordService passwordService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
    }

    // ==============================
    // GET ALL USERS
    // ==============================

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // ==============================
    // GET USER BY ID
    // ==============================

    public User getUserById(Long id) {

        return userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with id: " + id
                        )
                );
    }

    // ==============================
    // GET USER BY EMAIL
    // ==============================

    public User getUserByEmail(String email) {

        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );
    }

    // ==============================
    // CREATE USER
    // ==============================

    @Transactional
    public User createUser(User user) {

        if (user.getEmail() != null) {
            user.setEmail(user.getEmail().trim().toLowerCase());
        }
        if (user.getUsername() == null || user.getUsername().isBlank()) {
            user.setUsername(defaultUsername(user));
        } else {
            user.setUsername(user.getUsername().trim().toLowerCase());
        }

        if (userRepository.existsByEmailIgnoreCase(
                user.getEmail())) {

            throw new RuntimeException(
                    "Email already registered"
            );
        }

        if (user.getName() == null || user.getName().isBlank()
                || user.getEmail() == null || user.getEmail().isBlank()
                || user.getPassword() == null || user.getPassword().length() < 8) {
            throw new IllegalArgumentException(
                    "Name, email, and a password of at least 8 characters are required"
            );
        }

        if (user.getRole() == null) {
            user.setRole(Role.STAFF);
        }

        if (user.getStatus() == null) {
            user.setStatus(UserStatus.ACTIVE);
        }

        if (!passwordService.isEncoded(user.getPassword())) {
            user.setPassword(passwordService.hash(user.getPassword()));
        }

        return userRepository.save(user);
    }

    private String defaultUsername(User user) {
        String email = user.getEmail();
        if (email != null && !email.isBlank()) {
            return email.trim().toLowerCase().replaceAll("[^a-z0-9]+", ".");
        }
        return user.getName().trim().toLowerCase().replaceAll("[^a-z0-9]+", ".");
    }

    // ==============================
    // UPDATE USER
    // ==============================

    @Transactional
    public User updateUser(
            Long id,
            User request) {

        User existing = getUserById(id);

        existing.setName(request.getName());
        existing.setEmail(request.getEmail());
        existing.setPhone(request.getPhone());
        existing.setDepartment(request.getDepartment());
        existing.setLocation(request.getLocation());

        if (request.getRole() != null) {
            existing.setRole(request.getRole());
        }

        if (request.getStatus() != null) {
            existing.setStatus(request.getStatus());
        }

        return userRepository.save(existing);
    }

    @Transactional
    public User updateProfile(Long id, User request) {

        User existing = getUserById(id);

        if (request.getName() != null && !request.getName().isBlank()) {
            existing.setName(request.getName().trim());
        }
        if (request.getPhone() != null) {
            existing.setPhone(request.getPhone().trim());
        }
        if (request.getDepartment() != null) {
            existing.setDepartment(request.getDepartment().trim());
        }
        if (request.getLocation() != null) {
            existing.setLocation(request.getLocation().trim());
        }

        return userRepository.save(existing);
    }

    @Transactional
    public void upgradePassword(User user, String rawPassword) {
        user.setPassword(passwordService.hash(rawPassword));
        userRepository.save(user);
    }

    public boolean passwordMatches(User user, String rawPassword) {
        return passwordService.matches(rawPassword, user.getPassword());
    }

    // ==============================
    // SEARCH USERS
    // ==============================

    public List<User> searchUsers(String keyword) {

        return userRepository
                .findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContaining(
                        keyword,
                        keyword,
                        keyword
                );
    }

    // ==============================
    // FILTER BY ROLE
    // ==============================

    public List<User> getUsersByRole(Role role) {

        return userRepository.findByRole(role);
    }

    // ==============================
    // FILTER BY STATUS
    // ==============================

    public List<User> getUsersByStatus(
            UserStatus status) {

        return userRepository.findByStatus(status);
    }

    // ==============================
    // FILTER BY LOCATION
    // ==============================

    public List<User> getUsersByLocation(
            String location) {

        return userRepository
                .findByLocationIgnoreCase(location);
    }

    // ==============================
    // FILTER BY DEPARTMENT
    // ==============================

    public List<User> getUsersByDepartment(
            String department) {

        return userRepository
                .findByDepartmentIgnoreCase(department);
    }

    // ==============================
    // ACTIVATE
    // ==============================

    @Transactional
    public User activateUser(Long id) {

        User user = getUserById(id);

        user.setStatus(UserStatus.ACTIVE);

        return userRepository.save(user);
    }

    // ==============================
    // DEACTIVATE
    // ==============================

    @Transactional
    public User deactivateUser(Long id) {

        User user = getUserById(id);

        user.setStatus(UserStatus.INACTIVE);

        return userRepository.save(user);
    }

    // ==============================
    // BLOCK
    // ==============================

    @Transactional
    public User blockUser(Long id) {

        User user = getUserById(id);

        user.setStatus(UserStatus.BLOCKED);

        return userRepository.save(user);
    }

    // ==============================
    // UNBLOCK
    // ==============================

    @Transactional
    public User unblockUser(Long id) {

        User user = getUserById(id);

        user.setStatus(UserStatus.ACTIVE);

        return userRepository.save(user);
    }

    // ==============================
    // CHANGE STATUS
    // ==============================

    @Transactional
    public User changeStatus(
            Long id,
            UserStatus status) {

        User user = getUserById(id);

        user.setStatus(status);

        return userRepository.save(user);
    }

    // ==============================
    // UPDATE LAST LOGIN
    // ==============================

    @Transactional
    public User updateLastLogin(Long id) {

        User user = getUserById(id);

        user.setLastLogin(
                LocalDateTime.now()
        );

        return userRepository.save(user);
    }

    // ==============================
    // USER SUMMARY
    // ==============================

    public Map<String, Long> getUserSummary() {

        Map<String, Long> summary =
                new HashMap<>();

        summary.put(
                "totalUsers",
                userRepository.count()
        );

        summary.put(
                "activeUsers",
                userRepository.countByStatus(
                        UserStatus.ACTIVE
                )
        );

        summary.put(
                "inactiveUsers",
                userRepository.countByStatus(
                        UserStatus.INACTIVE
                )
        );

        summary.put(
                "blockedUsers",
                userRepository.countByStatus(
                        UserStatus.BLOCKED
                )
        );

        summary.put(
                "suspendedUsers",
                userRepository.countByStatus(
                        UserStatus.SUSPENDED
                )
        );

        summary.put(
                "admins",
                userRepository.countByRole(
                        Role.ADMIN
                )
        );

        summary.put(
                "pharmacists",
                userRepository.countByRole(
                        Role.PHARMACIST
                )
        );

        summary.put(
                "staff",
                userRepository.countByRole(
                        Role.STAFF
                )
        );

        return summary;
    }

    // ==============================
    // DELETE USER
    // ==============================

    @Transactional
    public void deleteUser(Long id) {

        User user = getUserById(id);

        userRepository.delete(user);
    }
}
