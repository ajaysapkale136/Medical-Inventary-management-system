package com.medistock.controller;

import com.medistock.entity.Medicine;
import com.medistock.service.MedicineService;
import com.medistock.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Export endpoints.
 * type = inventory | low-stock | expired | near-expiry
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final MedicineService medicineService;

    private List<Medicine> dataFor(String type) {
        return switch (type == null ? "inventory" : type) {
            case "low-stock"   -> medicineService.lowStock();
            case "expired"     -> medicineService.expired();
            case "near-expiry" -> medicineService.nearExpiry();
            default            -> medicineService.findAll();
        };
    }

    @GetMapping("/excel")
    public ResponseEntity<byte[]> excel(@RequestParam(defaultValue = "inventory") String type) {
        byte[] file = reportService.toExcel(dataFor(type), "MediStock");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=medistock-" + type + ".xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(file);
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> pdf(@RequestParam(defaultValue = "inventory") String type) {
        byte[] file = reportService.toPdf(dataFor(type), "MediStock " + type + " report");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=medistock-" + type + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(file);
    }
}
