package com.medistock.service;

import com.medistock.entity.*;
import com.medistock.entity.Notification.NotificationType;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/** Records purchases from suppliers and increases stock automatically. */
@Service
@RequiredArgsConstructor
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final MedicineRepository medicineRepository;
    private final SupplierRepository supplierRepository;
    private final MedicineService medicineService;
    private final NotificationService notificationService;

    public List<Purchase> findAll() {
        return purchaseRepository.findAll();
    }

    @Transactional
    public Purchase create(Long supplierId, Long medicineId, int quantity, BigDecimal totalCost, String performedBy) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found"));

        // A purchase always increases stock.
        medicineService.addStock(medicineId, quantity, "Purchase from " + supplier.getName(), performedBy);

        Purchase purchase = purchaseRepository.save(Purchase.builder()
                .supplier(supplier).medicine(medicine)
                .quantity(quantity).totalCost(totalCost).build());

        notificationService.save(NotificationType.PURCHASE,
                "Purchased " + quantity + " x " + medicine.getName() + " from " + supplier.getName());
        return purchase;
    }

    public void delete(Long id) {
        purchaseRepository.deleteById(id);
    }
}
