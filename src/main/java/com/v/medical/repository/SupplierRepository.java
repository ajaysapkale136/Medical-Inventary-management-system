package com.v.medical.repository;

import com.v.medical.entity.Supplier;
import com.v.medical.entity.SupplierStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupplierRepository
        extends JpaRepository<Supplier, Long> {

    // All suppliers
    List<Supplier> findAllByOrderByCompanyNameAsc();

    // Active / inactive / blocked
    List<Supplier> findByStatusOrderByCompanyNameAsc(
            SupplierStatus status
    );

    // Search by company
    List<Supplier> findByCompanyNameContainingIgnoreCase(
            String companyName
    );

    // Search by contact person
    List<Supplier> findByContactPersonContainingIgnoreCase(
            String contactPerson
    );

    // Search by email
    List<Supplier> findByEmailContainingIgnoreCase(
            String email
    );

    // Search by city
    List<Supplier> findByCityContainingIgnoreCase(
            String city
    );

    // Email lookup
    Optional<Supplier> findByEmailIgnoreCase(
            String email
    );

    // GST lookup
    Optional<Supplier> findByGstNumber(
            String gstNumber
    );
}