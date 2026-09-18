package com.medistock.repository;

import com.medistock.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    List<Supplier> findByNameContainingIgnoreCase(String name);
    Optional<Supplier> findByEmailIgnoreCase(String email);
}
