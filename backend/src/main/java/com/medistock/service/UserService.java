package com.medistock.service;

import com.medistock.dto.AuthDtos.*;
import com.medistock.entity.Role;
import com.medistock.entity.User;
import com.medistock.exception.*;
import com.medistock.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** User management + the role hierarchy rules. */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    /**
     * ROLE HIERARCHY RULE:
     *  - ADMIN      -> can create PHARMACIST, STAFF and SUPPLIER
     *  - PHARMACIST -> can create STAFF only
     *  - STAFF/SUPPLIER -> cannot create users
     *  - Nobody can ever create another ADMIN
     */
    public User createUser(CreateUserRequest request, User creator) {
        Role newRole = request.getRole();

        if (newRole == null) {
            throw new BadRequestException("Role is required");
        }
        if (newRole == Role.ADMIN && creator.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only Admin can create another Admin");
        }
        if (creator.getRole() == Role.STAFF || creator.getRole() == Role.SUPPLIER) {
            throw new BadRequestException("Only Admins and Pharmacists can create users");
        }
        if (creator.getRole() == Role.PHARMACIST && newRole != Role.STAFF) {
            throw new BadRequestException("Pharmacists can only create Staff accounts");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(newRole)
                .provider("LOCAL")
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(user);
        notificationService.system(creator.getFullName() + " created " + newRole + " account " + saved.getEmail());
        return saved;
    }

    public User updateProfile(String email, UpdateProfileRequest request) {
        User user = findByEmail(email);
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        return userRepository.save(user);
    }

    public void changePassword(String email, ChangePasswordRequest request) {
        User user = findByEmail(email);
        if (user.getPassword() == null
                || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /** Step 1 of password reset: generate a token (emailed to the user). */
    public String createResetToken(String email) {
        User user = findByEmail(email);
        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);
        return token;
    }

    /** Step 2 of password reset: exchange the token for a new password. */
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid reset token"));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Reset token has expired");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    public void toggleActive(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admin accounts cannot be disabled");
        }
        user.setActive(!user.isActive());
        userRepository.save(user);
    }

    public void delete(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admin accounts cannot be deleted");
        }
        userRepository.delete(user);
    }
}
