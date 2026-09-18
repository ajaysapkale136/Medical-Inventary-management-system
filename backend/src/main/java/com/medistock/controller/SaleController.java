package com.medistock.controller;

import com.medistock.dto.SaleDtos.*;
import com.medistock.entity.Sale;
import com.medistock.entity.User;
import com.medistock.service.ReportService;
import com.medistock.service.SaleService;
import com.medistock.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Process sales: decrement stock and generate bill. */
@RestController
@RequestMapping({"/api/sales", "/sales"})
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;
    private final UserService userService;
    private final ReportService reportService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','STAFF')")
    public ResponseEntity<SaleResponse> sell(@AuthenticationPrincipal UserDetails principal,
                                             @Valid @RequestBody SaleRequest request) {
        User actor = userService.findByEmail(principal.getUsername());
        return ResponseEntity.ok(saleService.processSale(request, actor.getFullName()));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SaleResponse>> adminSales() {
        return ResponseEntity.ok(saleService.findAllForAdmin());
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> pdf(@PathVariable Long id) {
        Sale sale = saleService.findById(id);
        byte[] file = reportService.toSalePdf(sale);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bill-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(file);
    }
}
