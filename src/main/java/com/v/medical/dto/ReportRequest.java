package com.v.medical.dto;

import com.v.medical.entity.ReportFormat;
import com.v.medical.entity.ReportType;

import java.time.LocalDate;

public record ReportRequest(

        String reportName,

        ReportType reportType,

        ReportFormat format,

        LocalDate fromDate,

        LocalDate toDate,

        String generatedBy

) {
}