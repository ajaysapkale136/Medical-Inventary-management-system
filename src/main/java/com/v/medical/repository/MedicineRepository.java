package com.v.medical.repository;

import com.v.medical.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    List<Medicine> findByNameContainingIgnoreCase(String name);

    List<Medicine> findByActiveTrue();

    List<Medicine> findByCategoryId(Long categoryId);

    List<Medicine> findBySupplierId(Long supplierId);
}