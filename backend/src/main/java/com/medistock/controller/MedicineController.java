package com.medistock.controller;

import com.medistock.dto.*;
import com.medistock.entity.*;
import com.medistock.service.MedicineService;
import com.medistock.dto.RestockRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Inventory endpoints. */
@RestController
@RequestMapping("/api/medicines")
@RequiredArgsConstructor
public class MedicineController {

    private final MedicineService medicineService;

    /** GET /api/medicines?keyword=&categoryId=&supplierId=&stockStatus= */
    @GetMapping
    public ResponseEntity<List<Medicine>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String stockStatus) {
        return ResponseEntity.ok(medicineService.search(keyword, categoryId, supplierId, stockStatus));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Medicine> one(@PathVariable Long id) {
        return ResponseEntity.ok(medicineService.findById(id));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Medicine>> lowStock() {
        return ResponseEntity.ok(medicineService.lowStock());
    }

    @GetMapping("/out-of-stock")
    public ResponseEntity<List<Medicine>> outOfStock() {
        return ResponseEntity.ok(medicineService.outOfStock());
    }

    @GetMapping("/near-expiry")
    public ResponseEntity<List<Medicine>> nearExpiry() {
        return ResponseEntity.ok(medicineService.nearExpiry());
    }

    @GetMapping("/expired")
    public ResponseEntity<List<Medicine>> expired() {
        return ResponseEntity.ok(medicineService.expired());
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<StockMovement>> history(@PathVariable Long id) {
        return ResponseEntity.ok(medicineService.history(id));
    }

    @GetMapping("/movements")
    public ResponseEntity<List<StockMovement>> movements() {
        return ResponseEntity.ok(medicineService.recentMovements());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','STAFF')")
    public ResponseEntity<Medicine> create(@AuthenticationPrincipal UserDetails principal,
                                           @Valid @RequestBody MedicineRequest request) {
        return ResponseEntity.ok(medicineService.create(request, principal.getUsername()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','STAFF')")
    public ResponseEntity<Medicine> update(@AuthenticationPrincipal UserDetails principal,
                                           @PathVariable Long id,
                                           @Valid @RequestBody MedicineRequest request) {
        return ResponseEntity.ok(medicineService.update(id, request, principal.getUsername()));
    }

    /** A supplier records stock delivered to the pharmacy. */
    @PatchMapping("/{id}/add-stock")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<Medicine> addStock(@AuthenticationPrincipal UserDetails principal,
                                             @PathVariable Long id,
                                             @RequestBody StockUpdateRequest request) {
        return ResponseEntity.ok(medicineService.addStock(id, request.getQuantity(),
                request.getNote(), principal.getUsername()));
    }

    @PatchMapping("/{id}/remove-stock")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','STAFF')")
    public ResponseEntity<Medicine> removeStock(@AuthenticationPrincipal UserDetails principal,
                                                @PathVariable Long id,
                                                @RequestBody StockUpdateRequest request) {
        return ResponseEntity.ok(medicineService.removeStock(id, request.getQuantity(),
                request.getNote(), principal.getUsername()));
    }

    @PostMapping("/{id}/restock")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<Medicine> restock(@AuthenticationPrincipal UserDetails principal,
                                            @PathVariable Long id,
                                            @Valid @RequestBody RestockRequest request) {
        return ResponseEntity.ok(medicineService.restock(id, request, principal.getUsername()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiMessage> delete(@PathVariable Long id) {
        medicineService.delete(id);
        return ResponseEntity.ok(new ApiMessage("Medicine deleted"));
    }
}
