package com.v.medical.controller;

import com.v.medical.entity.Inventory;
import com.v.medical.entity.StockLog;
import com.v.medical.Service.InventoryService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "http://localhost:3000")
public class InventoryController {

    private final InventoryService inventoryService;
    private final com.v.medical.Service.ExpiryAlertService expiryAlertService;

    public InventoryController(
            InventoryService inventoryService,
            com.v.medical.Service.ExpiryAlertService expiryAlertService) {
        this.inventoryService = inventoryService;
        this.expiryAlertService = expiryAlertService;
    }

    @GetMapping("/expiry-alerts")
    public ResponseEntity<Map<String, Object>> getExpiryAlerts() {
        return ResponseEntity.ok(expiryAlertService.getExpiryAlertSummary());
    }

    // ================================================
    // GET ALL
    // ================================================

    @GetMapping
    public ResponseEntity<List<Inventory>>
    getAllInventory() {

        return ResponseEntity.ok(
                inventoryService.getAllInventory()
        );
    }

    // ================================================
    // GET ACTIVE
    // ================================================

    @GetMapping("/active")
    public ResponseEntity<List<Inventory>>
    getActiveInventory() {

        return ResponseEntity.ok(
                inventoryService.getActiveInventory()
        );
    }

    // ================================================
    // GET BY ID
    // ================================================

    @GetMapping("/{id}")
    public ResponseEntity<Inventory>
    getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                inventoryService.getInventoryById(
                        id
                )
        );
    }

    // ================================================
    // GET BY MEDICINE
    // ================================================

    @GetMapping("/medicine/{medicineId}")
    public ResponseEntity<Inventory>
    getByMedicine(
            @PathVariable Long medicineId) {

        return ResponseEntity.ok(
                inventoryService.getByMedicine(
                        medicineId
                )
        );
    }

    // ================================================
    // GET BY BATCH
    // ================================================

    @GetMapping("/batch/{batchId}")
    public ResponseEntity<Inventory>
    getByBatch(
            @PathVariable Long batchId) {

        return ResponseEntity.ok(
                inventoryService.getByBatch(
                        batchId
                )
        );
    }

    // ================================================
    // SEARCH
    // ================================================

    @GetMapping("/search")
    public ResponseEntity<List<Inventory>>
    search(
            @RequestParam String name) {

        return ResponseEntity.ok(
                inventoryService.search(
                        name
                )
        );
    }

    // ================================================
    // LOW STOCK
    // ================================================

    @GetMapping("/low-stock")
    public ResponseEntity<List<Inventory>>
    getLowStock() {

        return ResponseEntity.ok(
                inventoryService.getLowStock()
        );
    }

    // ================================================
    // OUT OF STOCK
    // ================================================

    @GetMapping("/out-of-stock")
    public ResponseEntity<List<Inventory>>
    getOutOfStock() {

        return ResponseEntity.ok(
                inventoryService.getOutOfStock()
        );
    }

    // ================================================
    // CREATE INVENTORY
    // ================================================

    @PostMapping
    public ResponseEntity<Inventory>
    createInventory(
            @RequestBody Map<String, Object> body) {

        Long medicineId =
                Long.valueOf(
                        body.get("medicineId")
                                .toString()
                );

        Long batchId =
                Long.valueOf(
                        body.get("batchId")
                                .toString()
                );

        Integer quantity =
                Integer.valueOf(
                        body.get("quantity")
                                .toString()
                );

        Integer reorderLevel =
                Integer.valueOf(
                        body.get("reorderLevel")
                                .toString()
                );

        String location =
                body.get("location") == null
                        ? null
                        : body.get(
                                "location"
                        ).toString();

        return ResponseEntity.ok(
                inventoryService.createInventory(
                        medicineId,
                        batchId,
                        quantity,
                        reorderLevel,
                        location
                )
        );
    }

    // ================================================
    // STOCK IN
    // ================================================

    @PostMapping("/stock-in")
    public ResponseEntity<Inventory>
    stockIn(
            @RequestBody Map<String, Object> body) {

        Long inventoryId =
                Long.valueOf(
                        body.get("inventoryId")
                                .toString()
                );

        Integer quantity =
                Integer.valueOf(
                        body.get("quantity")
                                .toString()
                );

        String reason =
                getString(
                        body,
                        "reason"
                );

        String referenceNumber =
                getString(
                        body,
                        "referenceNumber"
                );

        String performedBy =
                getString(
                        body,
                        "performedBy"
                );

        return ResponseEntity.ok(
                inventoryService.stockIn(
                        inventoryId,
                        quantity,
                        reason,
                        referenceNumber,
                        performedBy
                )
        );
    }

    // ================================================
    // STOCK OUT
    // ================================================

    @PostMapping("/stock-out")
    public ResponseEntity<Inventory>
    stockOut(
            @RequestBody Map<String, Object> body) {

        Long inventoryId =
                Long.valueOf(
                        body.get("inventoryId")
                                .toString()
                );

        Integer quantity =
                Integer.valueOf(
                        body.get("quantity")
                                .toString()
                );

        String reason =
                getString(
                        body,
                        "reason"
                );

        String referenceNumber =
                getString(
                        body,
                        "referenceNumber"
                );

        String performedBy =
                getString(
                        body,
                        "performedBy"
                );

        return ResponseEntity.ok(
                inventoryService.stockOut(
                        inventoryId,
                        quantity,
                        reason,
                        referenceNumber,
                        performedBy
                )
        );
    }

    // ================================================
    // ADJUSTMENT
    // ================================================

    @PostMapping("/adjustment")
    public ResponseEntity<Inventory>
    adjustment(
            @RequestBody Map<String, Object> body) {

        Long inventoryId =
                Long.valueOf(
                        body.get("inventoryId")
                                .toString()
                );

        Integer newQuantity =
                Integer.valueOf(
                        body.get("newQuantity")
                                .toString()
                );

        String reason =
                getString(
                        body,
                        "reason"
                );

        String performedBy =
                getString(
                        body,
                        "performedBy"
                );

        return ResponseEntity.ok(
                inventoryService.adjustment(
                        inventoryId,
                        newQuantity,
                        reason,
                        performedBy
                )
        );
    }

    // ================================================
    // TRANSFER
    // ================================================

    @PostMapping("/transfer")
    public ResponseEntity<Inventory>
    transfer(
            @RequestBody Map<String, Object> body) {

        Long inventoryId =
                Long.valueOf(
                        body.get("inventoryId")
                                .toString()
                );

        Integer quantity =
                Integer.valueOf(
                        body.get("quantity")
                                .toString()
                );

        String destination =
                getString(
                        body,
                        "destination"
                );

        String performedBy =
                getString(
                        body,
                        "performedBy"
                );

        return ResponseEntity.ok(
                inventoryService.transferOut(
                        inventoryId,
                        quantity,
                        destination,
                        performedBy
                )
        );
    }

    // ================================================
    // RETURN
    // ================================================

    @PostMapping("/return")
    public ResponseEntity<Inventory>
    returnStock(
            @RequestBody Map<String, Object> body) {

        Long inventoryId =
                Long.valueOf(
                        body.get("inventoryId")
                                .toString()
                );

        Integer quantity =
                Integer.valueOf(
                        body.get("quantity")
                                .toString()
                );

        String reason =
                getString(
                        body,
                        "reason"
                );

        String performedBy =
                getString(
                        body,
                        "performedBy"
                );

        return ResponseEntity.ok(
                inventoryService.returnStock(
                        inventoryId,
                        quantity,
                        reason,
                        performedBy
                )
        );
    }

    // ================================================
    // STOCK HISTORY
    // ================================================

    @GetMapping("/history")
    public ResponseEntity<List<StockLog>>
    getAllHistory() {

        return ResponseEntity.ok(
                inventoryService.getAllHistory()
        );
    }

    // ================================================
    // MEDICINE STOCK HISTORY
    // ================================================

    @GetMapping("/history/{inventoryId}")
    public ResponseEntity<List<StockLog>>
    getHistory(
            @PathVariable Long inventoryId) {

        return ResponseEntity.ok(
                inventoryService.getHistory(
                        inventoryId
                )
        );
    }

    // ================================================
    // REORDER LEVEL
    // ================================================

    @PatchMapping("/{id}/reorder-level")
    public ResponseEntity<Inventory>
    updateReorderLevel(
            @PathVariable Long id,
            @RequestParam Integer level) {

        return ResponseEntity.ok(
                inventoryService
                        .updateReorderLevel(
                                id,
                                level
                        )
        );
    }

    // ================================================
    // LOCATION
    // ================================================

    @PatchMapping("/{id}/location")
    public ResponseEntity<Inventory>
    updateLocation(
            @PathVariable Long id,
            @RequestParam String location) {

        return ResponseEntity.ok(
                inventoryService.updateLocation(
                        id,
                        location
                )
        );
    }

    // ================================================
    // HELPER
    // ================================================

    private String getString(
            Map<String, Object> body,
            String key) {

        Object value =
                body.get(key);

        return value == null
                ? null
                : value.toString();
    }
}