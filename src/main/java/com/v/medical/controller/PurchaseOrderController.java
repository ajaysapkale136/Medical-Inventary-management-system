package com.v.medical.controller;

import com.v.medical.entity.*;
import com.v.medical.Service.PurchaseOrderService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchase-orders")
@CrossOrigin(origins = "http://localhost:3000")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final com.v.medical.Service.AutoReorderService autoReorderService;

    public PurchaseOrderController(
            PurchaseOrderService purchaseOrderService,
            com.v.medical.Service.AutoReorderService autoReorderService) {
        this.purchaseOrderService = purchaseOrderService;
        this.autoReorderService = autoReorderService;
    }

    @GetMapping
    public ResponseEntity<List<PurchaseOrder>>
    getAll() {

        return ResponseEntity.ok(
                purchaseOrderService
                        .getAllOrders()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrder>
    getOne(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                purchaseOrderService
                        .getOrder(id)
        );
    }

    @GetMapping("/search")
    public ResponseEntity<List<PurchaseOrder>>
    search(
            @RequestParam String keyword) {

        return ResponseEntity.ok(
                purchaseOrderService
                        .search(keyword)
        );
    }

    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<List<PurchaseOrder>>
    bySupplier(
            @PathVariable Long supplierId) {

        return ResponseEntity.ok(
                purchaseOrderService
                        .getBySupplier(
                                supplierId
                        )
        );
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<PurchaseOrder>>
    byStatus(
            @PathVariable PurchaseOrderStatus status) {

        return ResponseEntity.ok(
                purchaseOrderService
                        .getByStatus(status)
        );
    }

    @PostMapping
    public ResponseEntity<PurchaseOrder>
    create(
            @RequestBody Map<String, Object> body) {

        Long supplierId =
                Long.valueOf(
                        body.get("supplierId")
                                .toString()
                );

        String poNumber =
                body.get("poNumber")
                        .toString();

        String createdBy =
                body.get("createdBy") == null
                        ? null
                        : body.get(
                                "createdBy"
                        ).toString();

        PurchaseOrder order = purchaseOrderService
                .createOrder(
                        supplierId,
                        poNumber,
                        createdBy
                );

        if (body.get("notes") != null) {
            order.setNotes(body.get("notes").toString());
        }
        if (body.get("expectedDate") != null && !body.get("expectedDate").toString().isBlank()) {
            try {
                order.setExpectedDate(java.time.LocalDate.parse(body.get("expectedDate").toString()));
            } catch (Exception ignored) {}
        }
        if (body.get("totalAmount") != null) {
            try {
                java.math.BigDecimal amount = new java.math.BigDecimal(body.get("totalAmount").toString());
                order.setTotalAmount(amount);
                order.setSubtotal(amount);
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(purchaseOrderService.saveOrder(order));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<PurchaseOrder>
    addItem(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        Long medicineId =
                Long.valueOf(
                        body.get("medicineId")
                                .toString()
                );

        Integer quantity =
                Integer.valueOf(
                        body.get("quantity")
                                .toString()
                );

        BigDecimal unitPrice =
                new BigDecimal(
                        body.get("unitPrice")
                                .toString()
                );

        BigDecimal tax =
                body.get("tax") == null
                        ? BigDecimal.ZERO
                        : new BigDecimal(
                                body.get("tax")
                                        .toString()
                        );

        BigDecimal discount =
                body.get("discount") == null
                        ? BigDecimal.ZERO
                        : new BigDecimal(
                                body.get("discount")
                                        .toString()
                        );

        String batchNumber =
                body.get("batchNumber") == null
                        ? null
                        : body.get(
                                "batchNumber"
                        ).toString();

        return ResponseEntity.ok(
                purchaseOrderService.addItem(
                        id,
                        medicineId,
                        quantity,
                        unitPrice,
                        tax,
                        discount,
                        batchNumber
                )
        );
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<List<PurchaseOrderItem>>
    getItems(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                purchaseOrderService
                        .getItems(id)
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PurchaseOrder>
    updateStatus(
            @PathVariable Long id,
            @RequestParam PurchaseOrderStatus status) {

        return ResponseEntity.ok(
                purchaseOrderService
                        .updateStatus(
                                id,
                                status
                        )
        );
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<PurchaseOrder>
    cancel(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                purchaseOrderService
                        .cancelOrder(id)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    delete(
            @PathVariable Long id) {

        purchaseOrderService
                .deleteOrder(id);

        return ResponseEntity
                .noContent()
                .build();
    }

    @PostMapping("/auto-reorder")
    public ResponseEntity<Map<String, Object>> autoReorder() {
        return ResponseEntity.ok(autoReorderService.triggerManualReorder("ADMIN_API"));
    }
}