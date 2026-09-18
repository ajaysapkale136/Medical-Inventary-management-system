package com.medistock.service;

import com.medistock.dto.MedicineRequest;
import com.medistock.entity.*;
import com.medistock.entity.Notification.NotificationType;
import com.medistock.entity.StockMovement.MovementType;
import com.medistock.exception.*;
import com.medistock.repository.*;
import com.medistock.repository.PurchaseRepository;
import com.medistock.dto.RestockRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Inventory CRUD, stock movements and alerting. */
@Service
@RequiredArgsConstructor
public class MedicineService {

    private static final Logger log = LoggerFactory.getLogger(MedicineService.class);

    private final MedicineRepository medicineRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final StockMovementRepository stockMovementRepository;
    private final PurchaseRepository purchaseRepository;
    private final NotificationService notificationService;

    @Value("${medistock.expiry.near-days:30}")
    private int nearExpiryDays;

    /* ---------------- Read ---------------- */

    public List<Medicine> findAll() {
        return medicineRepository.findAll();
    }

    /** Restock by creating a Purchase and adding stock. */
    @Transactional
    public Medicine restock(Long id, RestockRequest request, String performedBy) {
        try {
            if (request.getQuantity() == null || request.getQuantity() <= 0)
                throw new BadRequestException("Quantity must be greater than zero");

            Medicine medicine = findById(id);

            Supplier supplier = null;
            if (request.getSupplierId() != null) {
                supplier = supplierRepository.findById(request.getSupplierId())
                        .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
            } else {
                supplier = medicine.getSupplier();
            }

            Purchase purchase = Purchase.builder()
                    .medicine(medicine)
                    .supplier(supplier)
                    .quantity(request.getQuantity())
                    .totalCost(request.getTotalCost())
                    .build();

            purchaseRepository.save(purchase);

            String note = request.getNote() == null ? "Restocked via purchase" : request.getNote();
            return addStock(id, request.getQuantity(), note, performedBy);
        } catch (Exception ex) {
            log.error("Restock failed for medicine id {}", id, ex);
            throw new RuntimeException("Restock failed: " + ex.getMessage());
        }
    }

    public Medicine findById(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found: " + id));
    }

    /** Search + filter used by the inventory page. */
    public List<Medicine> search(String keyword, Long categoryId, Long supplierId, String stockStatus) {
        List<Medicine> results = medicineRepository.search(keyword, categoryId, supplierId);

        if (stockStatus == null || stockStatus.isBlank() || "ALL".equalsIgnoreCase(stockStatus)) {
            return results;
        }
        return switch (stockStatus.toUpperCase()) {
            case "LOW"      -> results.stream().filter(Medicine::isLowStock).toList();
            case "OUT"      -> results.stream().filter(Medicine::isOutOfStock).toList();
            case "EXPIRED"  -> results.stream().filter(Medicine::isExpired).toList();
            case "IN_STOCK" -> results.stream().filter(m -> !m.isOutOfStock()).toList();
            default         -> results;
        };
    }

    public List<Medicine> lowStock() {
        return medicineRepository.findLowStock();
    }

    public List<Medicine> outOfStock() {
        return medicineRepository.findByQuantity(0);
    }

    public List<Medicine> expired() {
        return medicineRepository.findByExpiryDateBefore(LocalDate.now());
    }

    public List<Medicine> nearExpiry() {
        return medicineRepository.findByExpiryDateBetween(LocalDate.now(), LocalDate.now().plusDays(nearExpiryDays));
    }

    public List<StockMovement> history(Long medicineId) {
        return stockMovementRepository.findByMedicineIdOrderByCreatedAtDesc(medicineId);
    }

    public List<StockMovement> recentMovements() {
        return stockMovementRepository.findTop50ByOrderByCreatedAtDesc();
    }

    /* ---------------- Write ---------------- */

    @Transactional
    public Medicine create(MedicineRequest request, String performedBy) {
        Medicine medicine = new Medicine();
        apply(medicine, request);
        Medicine saved = medicineRepository.save(medicine);

        recordMovement(saved, MovementType.IN, saved.getQuantity(), "Initial stock", performedBy);
        checkAlerts(saved);
        return saved;
    }

    @Transactional
    public Medicine update(Long id, MedicineRequest request, String performedBy) {
        Medicine medicine = findById(id);
        int before = medicine.getQuantity() == null ? 0 : medicine.getQuantity();

        apply(medicine, request);
        medicine.setUpdatedAt(LocalDateTime.now());
        Medicine saved = medicineRepository.save(medicine);

        int diff = saved.getQuantity() - before;
        if (diff != 0) {
            recordMovement(saved, MovementType.ADJUSTMENT, Math.abs(diff), "Edited from inventory page", performedBy);
        }
        checkAlerts(saved);
        return saved;
    }

    /** Adds stock (goods received). */
    @Transactional
    public Medicine addStock(Long id, int quantity, String note, String performedBy) {
        if (quantity <= 0) throw new BadRequestException("Quantity must be greater than zero");
        Medicine medicine = findById(id);
        medicine.setQuantity(medicine.getQuantity() + quantity);
        medicine.setUpdatedAt(LocalDateTime.now());
        Medicine saved = medicineRepository.save(medicine);
        recordMovement(saved, MovementType.IN, quantity, note, performedBy);
        checkAlerts(saved);
        return saved;
    }

    /** Removes stock (dispensed / sold). */
    @Transactional
    public Medicine removeStock(Long id, int quantity, String note, String performedBy) {
        if (quantity <= 0) throw new BadRequestException("Quantity must be greater than zero");
        Medicine medicine = findById(id);
        if (medicine.getQuantity() < quantity) {
            throw new BadRequestException("Not enough stock. Available: " + medicine.getQuantity());
        }
        medicine.setQuantity(medicine.getQuantity() - quantity);
        medicine.setUpdatedAt(LocalDateTime.now());
        Medicine saved = medicineRepository.save(medicine);
        recordMovement(saved, MovementType.OUT, quantity, note, performedBy);
        checkAlerts(saved);
        return saved;
    }

    public void delete(Long id) {
        medicineRepository.delete(findById(id));
    }

    /* ---------------- Helpers ---------------- */

    private void apply(Medicine medicine, MedicineRequest request) {
        medicine.setName(request.getName());
        medicine.setBatchNumber(request.getBatchNumber());
        medicine.setQuantity(request.getQuantity() == null ? 0 : request.getQuantity());
        medicine.setLowStockThreshold(request.getLowStockThreshold() == null ? 20 : request.getLowStockThreshold());
        medicine.setManufacturingDate(request.getManufacturingDate());
        medicine.setExpiryDate(request.getExpiryDate());
        medicine.setPrice(request.getPrice());

        if (request.getCategoryId() != null) {
            medicine.setCategory(categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found")));
        }
        if (request.getSupplierId() != null) {
            medicine.setSupplier(supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier not found")));
        }
    }

    private void recordMovement(Medicine medicine, MovementType type, int qty, String note, String performedBy) {
        stockMovementRepository.save(StockMovement.builder()
                .medicine(medicine).type(type).quantity(qty)
                .resultingQuantity(medicine.getQuantity())
                .note(note).performedBy(performedBy).build());
    }

    /** Creates notifications when a medicine becomes low / out of stock or expires soon. */
    private void checkAlerts(Medicine medicine) {
        if (medicine.isOutOfStock()) {
            notificationService.save(NotificationType.OUT_OF_STOCK,
                    medicine.getName() + " (" + medicine.getBatchNumber() + ") is OUT OF STOCK");
        } else if (medicine.isLowStock()) {
            notificationService.save(NotificationType.LOW_STOCK,
                    medicine.getName() + " is low on stock (" + medicine.getQuantity() + " left)");
        }
        if (medicine.isExpired()) {
            notificationService.save(NotificationType.EXPIRED,
                    medicine.getName() + " batch " + medicine.getBatchNumber() + " has EXPIRED");
        } else if (medicine.getExpiryDate() != null
                && medicine.getExpiryDate().isBefore(LocalDate.now().plusDays(nearExpiryDays))) {
            notificationService.save(NotificationType.NEAR_EXPIRY,
                    medicine.getName() + " expires on " + medicine.getExpiryDate());
        }
    }
}
