package com.v.medical.controller;

import com.v.medical.Service.LowStockAlertService;
import com.v.medical.entity.LowStockAlert;
import com.v.medical.entity.Medicine;
import com.v.medical.repository.MedicineRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/low-stock-alerts")
@CrossOrigin(origins = "http://localhost:3000")
public class LowStockAlertController {

    private final LowStockAlertService alertService;
    private final MedicineRepository medicineRepository;

    public LowStockAlertController(
            LowStockAlertService alertService,
            MedicineRepository medicineRepository) {

        this.alertService = alertService;
        this.medicineRepository = medicineRepository;
    }

    // ==========================================
    // ALL ALERTS
    // ==========================================

    @GetMapping
    public ResponseEntity<List<LowStockAlert>>
    getAll() {

        return ResponseEntity.ok(
                alertService.getAll()
        );
    }

    // ==========================================
    // SUMMARY
    // ==========================================

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Long>>
    summary() {

        return ResponseEntity.ok(
                alertService.getSummary()
        );
    }

    // ==========================================
    // BY ID
    // ==========================================

    @GetMapping("/{id}")
    public ResponseEntity<LowStockAlert>
    getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                alertService.getById(id)
        );
    }

    // ==========================================
    // WARNING
    // ==========================================

    @GetMapping("/warning")
    public ResponseEntity<List<LowStockAlert>>
    warning() {

        return ResponseEntity.ok(
                alertService.getWarnings()
        );
    }

    // ==========================================
    // CRITICAL
    // ==========================================

    @GetMapping("/critical")
    public ResponseEntity<List<LowStockAlert>>
    critical() {

        return ResponseEntity.ok(
                alertService.getCritical()
        );
    }

    // ==========================================
    // OUT OF STOCK
    // ==========================================

    @GetMapping("/out-of-stock")
    public ResponseEntity<List<LowStockAlert>>
    outOfStock() {

        return ResponseEntity.ok(
                alertService.getOutOfStock()
        );
    }

    // ==========================================
    // MEDICINE
    // ==========================================

    @GetMapping("/medicine/{medicineId}")
    public ResponseEntity<List<LowStockAlert>>
    medicineAlerts(
            @PathVariable Long medicineId) {

        return ResponseEntity.ok(
                alertService
                        .getMedicineAlerts(
                                medicineId
                        )
        );
    }

    // ==========================================
    // CHECK STOCK
    // ==========================================

    @PostMapping("/check")
    public ResponseEntity<LowStockAlert>
    checkStock(
            @RequestBody StockCheckRequest request) {

        Medicine medicine = medicineRepository.findById(request.medicineId())
                .orElseThrow(() -> new RuntimeException(
                        "Medicine not found: " + request.medicineId()
                ));

        return ResponseEntity.ok(
                alertService.checkStock(
                        medicine,
                        request.currentStock(),
                        request.reorderLevel(),
                        request.reorderQuantity()
                )
        );
    }

    // ==========================================
    // RESOLVE
    // ==========================================

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<LowStockAlert>
    resolve(
            @PathVariable Long id,
            @RequestParam(
                    defaultValue =
                            "Stock replenished"
            )
            String note) {

        return ResponseEntity.ok(
                alertService.resolve(
                        id,
                        note
                )
        );
    }

    // ==========================================
    // DELETE
    // ==========================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    delete(
            @PathVariable Long id) {

        alertService.delete(id);

        return ResponseEntity.noContent()
                .build();
    }

    // ==========================================
    // REQUEST DTO
    // ==========================================

    public record StockCheckRequest(

            Long medicineId,

            Integer currentStock,

            Integer reorderLevel,

            Integer reorderQuantity
    ) {
    }
}
