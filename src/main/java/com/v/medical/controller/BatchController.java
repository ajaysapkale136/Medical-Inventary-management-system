package com.v.medical.controller;

import com.v.medical.entity.Batch;
import com.v.medical.Service.BatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/batches")
@CrossOrigin(origins = "http://localhost:3000")
public class BatchController {

    private final BatchService batchService;

    public BatchController(
            BatchService batchService) {

        this.batchService = batchService;
    }

    // GET ALL
    @GetMapping
    public ResponseEntity<List<Batch>>
    getAllBatches() {

        return ResponseEntity.ok(
                batchService.getAllBatches()
        );
    }

    // GET ACTIVE
    @GetMapping("/active")
    public ResponseEntity<List<Batch>>
    getActiveBatches() {

        return ResponseEntity.ok(
                batchService.getActiveBatches()
        );
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Batch>
    getBatchById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                batchService.getBatchById(id)
        );
    }

    // GET BY MEDICINE
    @GetMapping("/medicine/{medicineId}")
    public ResponseEntity<List<Batch>>
    getBatchesByMedicine(
            @PathVariable Long medicineId) {

        return ResponseEntity.ok(
                batchService.getBatchesByMedicine(
                        medicineId
                )
        );
    }

    // SEARCH
    @GetMapping("/search")
    public ResponseEntity<List<Batch>>
    searchBatches(
            @RequestParam String batchNumber) {

        return ResponseEntity.ok(
                batchService.searchBatches(
                        batchNumber
                )
        );
    }

    // EXPIRING SOON
    @GetMapping("/expiring")
    public ResponseEntity<List<Batch>>
    getExpiringBatches(
            @RequestParam(defaultValue = "30")
            int days) {

        return ResponseEntity.ok(
                batchService.getExpiringBatches(
                        days
                )
        );
    }

    // EXPIRED
    @GetMapping("/expired")
    public ResponseEntity<List<Batch>>
    getExpiredBatches() {

        return ResponseEntity.ok(
                batchService.getExpiredBatches()
        );
    }

    // CREATE
    @PostMapping("/medicine/{medicineId}")
    public ResponseEntity<Batch>
    createBatch(
            @PathVariable Long medicineId,
            @RequestBody Batch batch) {

        return ResponseEntity.ok(
                batchService.createBatch(
                        medicineId,
                        batch
                )
        );
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Batch>
    updateBatch(
            @PathVariable Long id,
            @RequestBody Batch batch) {

        return ResponseEntity.ok(
                batchService.updateBatch(
                        id,
                        batch
                )
        );
    }

    // UPDATE QUANTITY
    @PatchMapping("/{id}/quantity")
    public ResponseEntity<Batch>
    updateQuantity(
            @PathVariable Long id,
            @RequestParam Integer quantity) {

        return ResponseEntity.ok(
                batchService.updateQuantity(
                        id,
                        quantity
                )
        );
    }

    // DELETE / SOFT DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    deleteBatch(
            @PathVariable Long id) {

        batchService.deleteBatch(id);

        return ResponseEntity.noContent()
                .build();
    }
}