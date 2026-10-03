package com.v.medical.repository;

import com.v.medical.entity.Report;
import com.v.medical.entity.ReportFormat;
import com.v.medical.entity.ReportStatus;
import com.v.medical.entity.ReportType;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository
        extends JpaRepository<Report, Long> {

    List<Report>
    findAllByOrderByGeneratedAtDesc();

    List<Report>
    findByReportTypeOrderByGeneratedAtDesc(
            ReportType reportType
    );

    List<Report>
    findByFormatOrderByGeneratedAtDesc(
            ReportFormat format
    );

    List<Report>
    findByStatusOrderByGeneratedAtDesc(
            ReportStatus status
    );

    List<Report>
    findByFavoriteTrueOrderByGeneratedAtDesc();

    List<Report>
    findByGeneratedByContainingIgnoreCaseOrderByGeneratedAtDesc(
            String generatedBy
    );

    List<Report>
    findByReportNameContainingIgnoreCaseOrderByGeneratedAtDesc(
            String name
    );
}