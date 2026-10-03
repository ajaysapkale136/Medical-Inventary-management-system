package com.v.medical.controller;

import com.v.medical.Service.ExpiryTrackingService;
import com.v.medical.entity.ExpiryStatus;
import com.v.medical.entity.ExpiryTracking;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expiry")
@CrossOrigin(origins = "http://localhost:3000")
public class ExpiryTrackingController {

    private final ExpiryTrackingService
            expiryService;

    public ExpiryTrackingController(
            ExpiryTrackingService expiryService) {

        this.expiryService =
                expiryService;
    }

    // ==========================================
    // ALL EXPIRY RECORDS
    // ==========================================

    @GetMapping
    public ResponseEntity<List<ExpiryTracking>>
    getAll() {

        return ResponseEntity.ok(
                expiryService.getAll()
        );
    }

    // ==========================================
    // SUMMARY / KPI
    // ==========================================

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Long>>
    summary() {

        return ResponseEntity.ok(
                expiryService.getSummary()
        );
    }

    // ==========================================
    // SINGLE RECORD
    // ==========================================

    @GetMapping("/{id}")
    public ResponseEntity<ExpiryTracking>
    getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                expiryService.getById(id)
        );
    }

    // ==========================================
    // CREATE
    // ==========================================

    @PostMapping
    public ResponseEntity<ExpiryTracking>
    create(
            @RequestBody ExpiryTracking expiry) {

        return ResponseEntity.ok(
                expiryService.create(expiry)
        );
    }

    // ==========================================
    // UPDATE
    // ==========================================

    @PutMapping("/{id}")
    public ResponseEntity<ExpiryTracking>
    update(
            @PathVariable Long id,
            @RequestBody ExpiryTracking expiry) {

        return ResponseEntity.ok(
                expiryService.update(
                        id,
                        expiry
                )
        );
    }

    // ==========================================
    // SEARCH MEDICINE
    // ==========================================

    @GetMapping("/search")
    public ResponseEntity<List<ExpiryTracking>>
    search(
            @RequestParam String medicine) {

        return ResponseEntity.ok(
                expiryService.search(medicine)
        );
    }

    // ==========================================
    // STATUS
    // ==========================================

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ExpiryTracking>>
    byStatus(
            @PathVariable ExpiryStatus status) {

        return ResponseEntity.ok(
                expiryService.getByStatus(
                        status
                )
        );
    }

    // ==========================================
    // NEAR EXPIRY
    // ==========================================

    @GetMapping("/near-expiry")
    public ResponseEntity<List<ExpiryTracking>>
    nearExpiry(
            @RequestParam(defaultValue = "30")
            Integer days) {

        return ResponseEntity.ok(
                expiryService.getNearExpiry(
                        days
                )
        );
    }

    // ==========================================
    // EXPIRED
    // ==========================================

    @GetMapping("/expired")
    public ResponseEntity<List<ExpiryTracking>>
    expired() {

        return ResponseEntity.ok(
                expiryService.getExpired()
        );
    }

    // ==========================================
    // DATE RANGE
    // ==========================================

    @GetMapping("/date-range")
    public ResponseEntity<List<ExpiryTracking>>
    dateRange(

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate from,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate to) {

        return ResponseEntity.ok(
                expiryService.getByDateRange(
                        from,
                        to
                )
        );
    }

    // ==========================================
    // MARK NOTIFIED
    // ==========================================

    @PatchMapping("/{id}/mark-notified")
    public ResponseEntity<ExpiryTracking>
    markNotified(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                expiryService.markNotified(id)
        );
    }

    // ==========================================
    // DISPOSE
    // ==========================================

    @PatchMapping("/{id}/dispose")
    public ResponseEntity<ExpiryTracking>
    dispose(
            @PathVariable Long id,
            @RequestParam String reason) {

        return ResponseEntity.ok(
                expiryService.dispose(
                        id,
                        reason
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

        expiryService.delete(id);

        return ResponseEntity.noContent()
                .build();
    }
}