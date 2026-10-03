package com.v.medical.repository;

import com.v.medical.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository
        extends JpaRepository<Category, Long> {

    Optional<Category> findByNameIgnoreCase(String name);

    List<Category> findByNameContainingIgnoreCase(String name);

    List<Category> findByActiveTrue();

    List<Category> findByActiveFalse();

    boolean existsByNameIgnoreCase(String name);
}