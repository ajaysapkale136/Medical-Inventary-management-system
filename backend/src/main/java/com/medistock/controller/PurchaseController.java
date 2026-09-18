package com.medistock.controller;

import com.medistock.dto.ApiMessage;
import com.medistock.entity.Purchase;
import com.medistock.service.PurchaseService;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
public class PurchaseController {

    private final PurchaseService purchaseService;

    /** Request body for creating a purchase. */
    @Getter @Setter @NoArgsConstructor
    public static class PurchaseRequest {
        private Long supplierId;
        private Long medicineId;
        private Integer quantity;
        private BigDecimal totalCost;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Purchase>> list() {
        return ResponseEntity.ok(purchaseService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<Purchase> create(@AuthenticationPrincipal UserDetails principal,
                                           @RequestBody PurchaseRequest request) {
        return ResponseEntity.ok(purchaseService.create(
                request.getSupplierId(), request.getMedicineId(),
                request.getQuantity(), request.getTotalCost(), principal.getUsername()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiMessage> delete(@PathVariable Long id) {
        purchaseService.delete(id);
        return ResponseEntity.ok(new ApiMessage("Purchase deleted"));
    }
}
