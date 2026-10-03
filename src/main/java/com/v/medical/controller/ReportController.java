package com.v.medical.controller;

import com.v.medical.Service.ReportService;
import com.v.medical.dto.ReportRequest;
import com.v.medical.entity.Report;
import com.v.medical.entity.ReportFormat;
import com.v.medical.entity.ReportType;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(
            ReportService reportService) {

        this.reportService =
                reportService;
    }

    // ==========================================
    // ALL REPORTS
    // ==========================================

    @GetMapping
    public ResponseEntity<List<Report>>
    getAll() {

        return ResponseEntity.ok(
                reportService.getAll()
        );
    }

    // ==========================================
    // SINGLE REPORT
    // ==========================================

    @GetMapping("/{id}")
    public ResponseEntity<Report>
    getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                reportService.getById(id)
        );
    }

    // ==========================================
    // GENERATE
    // ==========================================

    @PostMapping("/generate")
    public ResponseEntity<Report>
    generate(
            @RequestBody ReportRequest request) {

        return ResponseEntity.ok(
                reportService.generate(
                        request
                )
        );
    }

    // ==========================================
    // REPORT CATEGORY
    // ==========================================

    @GetMapping("/type/{type}")
    public ResponseEntity<List<Report>>
    byType(
            @PathVariable ReportType type) {

        return ResponseEntity.ok(
                reportService.getByType(
                        type
                )
        );
    }

    // ==========================================
    // FAVORITES
    // ==========================================

    @GetMapping("/favorites")
    public ResponseEntity<List<Report>>
    favorites() {

        return ResponseEntity.ok(
                reportService.getFavorites()
        );
    }

    // ==========================================
    // FAVORITE
    // ==========================================

    @PatchMapping("/{id}/favorite")
    public ResponseEntity<Report>
    favorite(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                reportService.toggleFavorite(
                        id
                )
        );
    }

    // ==========================================
    // DYNAMIC NAMED DOWNLOADS
    // ==========================================

    @GetMapping("/inventory-summary/download")
    public ResponseEntity<ByteArrayResource> downloadInventorySummary(
            @RequestParam(defaultValue = "PDF") String format) {
        return downloadNamedReport("Inventory Summary Report", ReportType.INVENTORY, format);
    }

    @GetMapping("/stock-movement/download")
    public ResponseEntity<ByteArrayResource> downloadStockMovement(
            @RequestParam(defaultValue = "PDF") String format) {
        return downloadNamedReport("Stock Movement Report", ReportType.STOCK_MOVEMENT, format);
    }

    @GetMapping({"/expiry-summary/download", "/expiring-medicines/download"})
    public ResponseEntity<ByteArrayResource> downloadExpirySummary(
            @RequestParam(defaultValue = "PDF") String format) {
        return downloadNamedReport("Expiry Tracking Report", ReportType.EXPIRY, format);
    }

    @GetMapping("/purchase-orders/download")
    public ResponseEntity<ByteArrayResource> downloadPurchaseOrders(
            @RequestParam(defaultValue = "PDF") String format) {
        return downloadNamedReport("Purchase Orders Report", ReportType.PURCHASE_ORDER, format);
    }

    @GetMapping({"/supplier-analysis/download", "/suppliers/download"})
    public ResponseEntity<ByteArrayResource> downloadSupplierAnalysis(
            @RequestParam(defaultValue = "PDF") String format) {
        return downloadNamedReport("Supplier Directory Report", ReportType.SUPPLIER, format);
    }

    private ResponseEntity<ByteArrayResource> downloadNamedReport(
            String title, ReportType type, String formatStr) {
        ReportFormat format = "EXCEL".equalsIgnoreCase(formatStr) || "XLSX".equalsIgnoreCase(formatStr)
                ? ReportFormat.EXCEL : ReportFormat.PDF;

        Report report = reportService.generate(new ReportRequest(
                title,
                type,
                format,
                null,
                null,
                "System"
        ));

        byte[] data = reportService.download(report.getId());
        ByteArrayResource resource = new ByteArrayResource(data);

        MediaType mediaType = format == ReportFormat.PDF
                ? MediaType.APPLICATION_PDF
                : MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + report.getFileName() + "\"")
                .contentLength(data.length)
                .body(resource);
    }

    // ==========================================
    // DOWNLOAD BY ID
    // ==========================================

    @GetMapping("/{id}/download")
    public ResponseEntity<ByteArrayResource>
    download(
            @PathVariable Long id) {

        Report report =
                reportService.getById(id);

        byte[] data =
                reportService.download(id);

        ByteArrayResource resource =
                new ByteArrayResource(data);

        MediaType mediaType =
                report.getFormat()
                        .name()
                        .equals("PDF")
                        ? MediaType.APPLICATION_PDF
                        : MediaType.parseMediaType(
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        );

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\""
                                + report.getFileName()
                                + "\""
                )
                .contentLength(data.length)
                .body(resource);
    }

    // ==========================================
    // DELETE
    // ==========================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    delete(
            @PathVariable Long id) {

        reportService.delete(id);

        return ResponseEntity.noContent()
                .build();
    }
}