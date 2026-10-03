package com.v.medical.repository;

import com.v.medical.entity.PurchaseOrderItem;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PurchaseOrderItemRepository
        extends JpaRepository<
                PurchaseOrderItem,
                Long> {

    List<PurchaseOrderItem>
    findByPurchaseOrderId(
            Long purchaseOrderId
    );

    List<PurchaseOrderItem>
    findByMedicineId(
            Long medicineId
    );
}