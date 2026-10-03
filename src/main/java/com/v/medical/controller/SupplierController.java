package com.v.medical.controller;

import com.v.medical.entity.Supplier;
import com.v.medical.Service.SupplierService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "http://localhost:3000")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(
            SupplierService supplierService) {

        this.supplierService = supplierService;
    }

    // GET ALL
    @GetMapping
    public ResponseEntity<List<Supplier>> getAllSuppliers() {

        return ResponseEntity.ok(
                supplierService.getAllSuppliers()
        );
    }

    // GET ACTIVE
    @GetMapping("/active")
    public ResponseEntity<List<Supplier>> getActiveSuppliers() {

        return ResponseEntity.ok(
                supplierService.getActiveSuppliers()
        );
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Supplier> getSupplierById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                supplierService.getSupplierById(id)
        );
    }

    // SEARCH
    @GetMapping("/search")
    public ResponseEntity<List<Supplier>> searchSuppliers(
            @RequestParam String name) {

        return ResponseEntity.ok(
                supplierService.searchSuppliers(name)
        );
    }

    // CREATE
    @PostMapping
    public ResponseEntity<Supplier> createSupplier(
            @RequestBody Supplier supplier) {

        return ResponseEntity.ok(
                supplierService.createSupplier(supplier)
        );
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Supplier> updateSupplier(
            @PathVariable Long id,
            @RequestBody Supplier supplier) {

        return ResponseEntity.ok(
                supplierService.updateSupplier(
                        id,
                        supplier
                )
        );
    }

    // ACTIVATE / DEACTIVATE
    @PatchMapping("/{id}/status")
    public ResponseEntity<Supplier> updateStatus(
            @PathVariable Long id,
            @RequestParam boolean active) {

        return ResponseEntity.ok(
                supplierService.updateStatus(
                        id,
                        active
                )
        );
    }

    // DELETE / SOFT DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSupplier(
            @PathVariable Long id) {

        supplierService.deleteSupplier(id);

        return ResponseEntity.noContent().build();
    }
}