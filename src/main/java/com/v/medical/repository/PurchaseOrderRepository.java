package com.v.medical.repository;

import com.v.medical.entity.PurchaseOrder;
import com.v.medical.entity.PurchaseOrderStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PurchaseOrderRepository
        extends JpaRepository<PurchaseOrder, Long> {

    Optional<PurchaseOrder>
    findByPoNumber(String poNumber);

    boolean existsByPoNumber(String poNumber);

    List<PurchaseOrder>
    findByStatus(
            PurchaseOrderStatus status
    );

    List<PurchaseOrder>
    findBySupplierId(
            Long supplierId
    );

    List<PurchaseOrder>
    findByPoNumberContainingIgnoreCase(
            String poNumber
    );

    List<PurchaseOrder>
    findAllByOrderByCreatedAtDesc();
}