package com.v.medical.controller;

import com.v.medical.Service.OnlineOrderService;
import com.v.medical.entity.OnlineOrder;
import com.v.medical.entity.OnlineOrderStatus;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/online-orders")
@CrossOrigin(origins = "http://localhost:3000")
public class OnlineOrderController {

    private final OnlineOrderService orderService;

    public OnlineOrderController(
            OnlineOrderService orderService) {

        this.orderService =
                orderService;
    }

    // ==========================================
    // ALL ORDERS
    // ==========================================

    @GetMapping
    public ResponseEntity<List<OnlineOrder>>
    getAllOrders() {

        return ResponseEntity.ok(
                orderService.getAllOrders()
        );
    }

    // ==========================================
    // SINGLE ORDER
    // ==========================================

    @GetMapping("/{id}")
    public ResponseEntity<OnlineOrder>
    getOrder(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                orderService.getOrderById(id)
        );
    }

    // ==========================================
    // ORDER NUMBER
    // ==========================================

    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<OnlineOrder>
    getByOrderNumber(
            @PathVariable String orderNumber) {

        return ResponseEntity.ok(
                orderService
                        .getOrderByNumber(
                                orderNumber
                        )
        );
    }

    // ==========================================
    // CREATE
    // ==========================================

    @PostMapping
    public ResponseEntity<OnlineOrder>
    createOrder(
            @RequestBody OnlineOrder order) {

        return ResponseEntity.ok(
                orderService.createOrder(
                        order
                )
        );
    }

    // ==========================================
    // STATUS
    // ==========================================

    @PatchMapping("/{id}/status")
    public ResponseEntity<OnlineOrder>
    updateStatus(
            @PathVariable Long id,
            @RequestParam
            OnlineOrderStatus status) {

        return ResponseEntity.ok(
                orderService
                        .updateOrderStatus(
                                id,
                                status
                        )
        );
    }

    // ==========================================
    // PAYMENT
    // ==========================================

    @PatchMapping("/{id}/payment")
    public ResponseEntity<OnlineOrder>
    updatePayment(
            @PathVariable Long id,
            @RequestParam String status) {

        return ResponseEntity.ok(
                orderService
                        .updatePaymentStatus(
                                id,
                                status
                        )
        );
    }

    // ==========================================
    // FILTER STATUS
    // ==========================================

    @GetMapping("/status/{status}")
    public ResponseEntity<List<OnlineOrder>>
    byStatus(
            @PathVariable
            OnlineOrderStatus status) {

        return ResponseEntity.ok(
                orderService
                        .getOrdersByStatus(
                                status
                        )
        );
    }

    // ==========================================
    // SEARCH CUSTOMER
    // ==========================================

    @GetMapping("/search")
    public ResponseEntity<List<OnlineOrder>>
    search(
            @RequestParam String customerName) {

        return ResponseEntity.ok(
                orderService
                        .searchOrders(
                                customerName
                        )
        );
    }

    // ==========================================
    // PLATFORM
    // ==========================================

    @GetMapping("/platform")
    public ResponseEntity<List<OnlineOrder>>
    platform(
            @RequestParam String name) {

        return ResponseEntity.ok(
                orderService
                        .searchByPlatform(
                                name
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

        orderService.deleteOrder(id);

        return ResponseEntity
                .noContent()
                .build();
    }
}