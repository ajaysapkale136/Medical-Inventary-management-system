package com.medistock.controller;

import com.medistock.dto.ApiMessage;
import com.medistock.entity.*;
import com.medistock.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<List<Supplier>> list(@RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(supplierService.search(keyword));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Supplier> one(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.findById(id));
    }

    @GetMapping("/{id}/medicines")
    public ResponseEntity<List<Medicine>> medicines(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.medicinesOf(id));
    }

    @GetMapping("/{id}/purchases")
    public ResponseEntity<List<Purchase>> purchases(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.purchasesOf(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<Supplier> create(@Valid @RequestBody Supplier supplier) {
        return ResponseEntity.ok(supplierService.save(supplier));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<Supplier> update(@PathVariable Long id, @Valid @RequestBody Supplier supplier) {
        return ResponseEntity.ok(supplierService.update(id, supplier));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiMessage> delete(@PathVariable Long id) {
        supplierService.delete(id);
        return ResponseEntity.ok(new ApiMessage("Supplier deleted"));
    }
}
