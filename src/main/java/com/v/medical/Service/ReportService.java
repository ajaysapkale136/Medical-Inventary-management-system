package com.v.medical.Service;

import com.v.medical.dto.ReportRequest;
import com.v.medical.entity.*;

import com.v.medical.repository.ReportRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final ReportRepository reportRepository;

    private final ReportDataService reportDataService;

    private final PdfReportGenerator pdfGenerator;

    private final ExcelReportGenerator excelGenerator;

    private final Path reportDirectory =
            Paths.get("reports");

    public ReportService(
            ReportRepository reportRepository,
            ReportDataService reportDataService,
            PdfReportGenerator pdfGenerator,
            ExcelReportGenerator excelGenerator) {

        this.reportRepository =
                reportRepository;

        this.reportDataService =
                reportDataService;

        this.pdfGenerator =
                pdfGenerator;

        this.excelGenerator =
                excelGenerator;

        try {

            Files.createDirectories(
                    reportDirectory
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Unable to create report directory",
                    e
            );
        }
    }

    // ==========================================
    // GENERATE
    // ==========================================

    @Transactional
    public Report generate(
            ReportRequest request) {

        validate(request);

        Report report =
                new Report();

        report.setReportName(
                request.reportName()
        );

        report.setReportType(
                request.reportType()
        );

        report.setFormat(
                request.format()
        );

        report.setFromDate(
                request.fromDate()
        );

        report.setToDate(
                request.toDate()
        );

        report.setGeneratedBy(
                request.generatedBy()
        );

        report.setStatus(
                ReportStatus.GENERATING
        );

        report =
                reportRepository.save(report);

        try {

            List<Map<String, Object>> data =
                    reportDataService
                            .getReportData(
                                    request.reportType(),
                                    request.fromDate(),
                                    request.toDate()
                            );

            String extension =
                    request.format() ==
                            ReportFormat.PDF
                            ? ".pdf"
                            : ".xlsx";

            String safeName =
                    request.reportName()
                            .replaceAll(
                                    "[^a-zA-Z0-9-_]",
                                    "_"
                            );

            String fileName =
                    safeName
                            + "_"
                            + System.currentTimeMillis()
                            + extension;

            Path file =
                    reportDirectory.resolve(
                            fileName
                    );

            byte[] content;

            if (request.format() ==
                    ReportFormat.PDF) {

                content =
                        pdfGenerator.generate(
                                request.reportName(),
                                request.generatedBy(),
                                data
                        );

            } else {

                content =
                        excelGenerator.generate(
                                request.reportName(),
                                data
                        );
            }

            Files.write(
                    file,
                    content
            );

            report.setFileName(
                    fileName
            );

            report.setFilePath(
                    file.toAbsolutePath()
                            .toString()
            );

            report.setFileSize(
                    (long) content.length
            );

            report.setStatus(
                    ReportStatus.SUCCESS
            );

            report.setCompletedAt(
                    LocalDateTime.now()
            );

            return reportRepository.save(
                    report
            );

        } catch (Exception e) {

            report.setStatus(
                    ReportStatus.FAILED
            );

            report.setErrorMessage(
                    e.getMessage()
            );

            report.setCompletedAt(
                    LocalDateTime.now()
            );

            return reportRepository.save(
                    report
            );
        }
    }

    // ==========================================
    // LIST
    // ==========================================

    public List<Report> getAll() {

        return reportRepository
                .findAllByOrderByGeneratedAtDesc();
    }

    // ==========================================
    // GET
    // ==========================================

    public Report getById(Long id) {

        return reportRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Report not found: "
                                        + id
                        ));
    }

    // ==========================================
    // CATEGORY
    // ==========================================

    public List<Report>
    getByType(ReportType type) {

        return reportRepository
                .findByReportTypeOrderByGeneratedAtDesc(
                        type
                );
    }

    // ==========================================
    // FAVORITES
    // ==========================================

    public List<Report>
    getFavorites() {

        return reportRepository
                .findByFavoriteTrueOrderByGeneratedAtDesc();
    }

    // ==========================================
    // FAVORITE TOGGLE
    // ==========================================

    @Transactional
    public Report toggleFavorite(
            Long id) {

        Report report =
                getById(id);

        report.setFavorite(
                !report.isFavorite()
        );

        return reportRepository.save(
                report
        );
    }

    // ==========================================
    // DOWNLOAD
    // ==========================================

    public byte[] download(Long id) {

        Report report =
                getById(id);

        if (report.getStatus() !=
                ReportStatus.SUCCESS) {

            throw new RuntimeException(
                    "Report is not ready for download"
            );
        }

        try {

            return Files.readAllBytes(
                    Paths.get(
                            report.getFilePath()
                    )
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Unable to read report file",
                    e
            );
        }
    }

    // ==========================================
    // DELETE
    // ==========================================

    @Transactional
    public void delete(Long id) {

        Report report =
                getById(id);

        try {

            if (report.getFilePath() != null) {

                Files.deleteIfExists(
                        Paths.get(
                                report.getFilePath()
                        )
                );
            }

        } catch (IOException e) {

            throw new RuntimeException(
                    "Unable to delete report file",
                    e
            );
        }

        reportRepository.delete(report);
    }

    // ==========================================
    // VALIDATION
    // ==========================================

    private void validate(
            ReportRequest request) {

        if (request.reportName() == null ||
                request.reportName().isBlank()) {

            throw new RuntimeException(
                    "Report name is required"
            );
        }

        if (request.reportType() == null) {

            throw new RuntimeException(
                    "Report type is required"
            );
        }

        if (request.format() == null) {

            throw new RuntimeException(
                    "Report format is required"
            );
        }

        if (request.fromDate() != null &&
                request.toDate() != null &&
                request.fromDate()
                        .isAfter(
                                request.toDate()
                        )) {

            throw new RuntimeException(
                    "From date cannot be after to date"
            );
        }
    }
}