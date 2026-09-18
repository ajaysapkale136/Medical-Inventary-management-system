package com.medistock.repository;

import com.medistock.entity.Role;
import com.medistock.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByResetToken(String resetToken);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    long countByRole(Role role);
}
