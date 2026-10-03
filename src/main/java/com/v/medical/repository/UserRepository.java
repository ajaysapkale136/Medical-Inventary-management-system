package com.v.medical.repository;

import com.v.medical.entity.Role;
import com.v.medical.entity.User;
import com.v.medical.entity.UserStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository
        extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(
            String email
    );

    boolean existsByEmailIgnoreCase(
            String email
    );

    List<User> findByStatus(
            UserStatus status
    );

    List<User> findByRole(
            Role role
    );

    List<User> findByLocationIgnoreCase(
            String location
    );

    List<User> findByDepartmentIgnoreCase(
            String department
    );

    List<User> findByNameContainingIgnoreCase(
            String name
    );

    List<User>
    findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContaining(
            String name,
            String email,
            String phone
    );

    long countByStatus(
            UserStatus status
    );

    long countByRole(
            Role role
    );
}