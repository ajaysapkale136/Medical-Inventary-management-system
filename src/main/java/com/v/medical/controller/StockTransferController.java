package com.v.medical.controller;

import com.v.medical.Service.StockTransferService;
import com.v.medical.entity.StockTransfer;
import com.v.medical.entity.TransferStatus;
import com.v.medical.entity.TransferUrgency;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transfers")
public class StockTransferController {

    private final StockTransferService stockTransferService;

    public StockTransferController(StockTransferService stockTransferService) {
        this.stockTransferService = stockTransferService;
    }

    @GetMapping
    public ResponseEntity<List<StockTransfer>> getAllTransfers(@RequestParam(required = false) String status) {
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            try {
                TransferStatus s = TransferStatus.valueOf(status.toUpperCase());
                return ResponseEntity.ok(stockTransferService.getTransfersByStatus(s));
            } catch (IllegalArgumentException ignored) {}
        }
        return ResponseEntity.ok(stockTransferService.getAllTransfers());
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(stockTransferService.getTransferSummary());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockTransfer> getById(@PathVariable Long id) {
        return ResponseEntity.ok(stockTransferService.getById(id));
    }

    @PostMapping
    public ResponseEntity<StockTransfer> requestTransfer(@RequestBody Map<String, Object> req) {
        Long medicineId = Long.parseLong(req.get("medicineId").toString());
        Long batchId = Long.parseLong(req.get("batchId").toString());
        Integer quantity = Integer.parseInt(req.get("quantity").toString());
        String fromLocation = (String) req.getOrDefault("fromLocation", "Central Pharmacy");
        String toLocation = (String) req.getOrDefault("toLocation", "Emergency Ward");
        String notes = (String) req.getOrDefault("notes", "");
        String requestedBy = (String) req.getOrDefault("requestedBy", "STAFF");

        TransferUrgency urgency = TransferUrgency.ROUTINE;
        if (req.containsKey("urgency")) {
            try {
                urgency = TransferUrgency.valueOf(req.get("urgency").toString().toUpperCase());
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(stockTransferService.requestTransfer(
                medicineId, batchId, fromLocation, toLocation, quantity, urgency, requestedBy, notes
        ));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<StockTransfer> approve(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String approvedBy = body != null ? body.getOrDefault("approvedBy", "PHARMACIST") : "PHARMACIST";
        return ResponseEntity.ok(stockTransferService.approveTransfer(id, approvedBy));
    }

    @PostMapping("/{id}/dispatch")
    public ResponseEntity<StockTransfer> dispatch(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String dispatchedBy = body != null ? body.getOrDefault("dispatchedBy", "PHARMACIST") : "PHARMACIST";
        return ResponseEntity.ok(stockTransferService.dispatchTransfer(id, dispatchedBy));
    }

    @PostMapping("/{id}/receive")
    public ResponseEntity<StockTransfer> receive(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String receivedBy = body != null ? body.getOrDefault("receivedBy", "WARD_STAFF") : "WARD_STAFF";
        return ResponseEntity.ok(stockTransferService.receiveTransfer(id, receivedBy));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<StockTransfer> reject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String rejectedBy = body.getOrDefault("rejectedBy", "PHARMACIST");
        String reason = body.getOrDefault("reason", "Stock unavailable or invalid request");
        return ResponseEntity.ok(stockTransferService.rejectTransfer(id, rejectedBy, reason));
    }
}
