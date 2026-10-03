package com.v.medical.Service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

@Component
public class ExcelReportGenerator {

    public byte[] generate(
            String title,
            List<Map<String, Object>> rows) {

        try {

            Workbook workbook =
                    new XSSFWorkbook();

            Sheet sheet =
                    workbook.createSheet(
                            "Report"
                    );

            // ==================================
            // TITLE
            // ==================================

            Row titleRow =
                    sheet.createRow(0);

            Cell titleCell =
                    titleRow.createCell(0);

            titleCell.setCellValue(
                    title
            );

            // ==================================
            // NO DATA
            // ==================================

            if (rows == null ||
                    rows.isEmpty()) {

                Row row =
                        sheet.createRow(2);

                row.createCell(0)
                        .setCellValue(
                                "No data available."
                        );

                ByteArrayOutputStream output =
                        new ByteArrayOutputStream();

                workbook.write(output);
                workbook.close();

                return output.toByteArray();
            }

            // ==================================
            // HEADER
            // ==================================

            Map<String, Object> firstRow =
                    rows.get(0);

            Row header =
                    sheet.createRow(2);

            int column = 0;

            for (String key :
                    firstRow.keySet()) {

                header.createCell(column++)
                        .setCellValue(key);
            }

            // ==================================
            // DATA
            // ==================================

            int rowNumber = 3;

            for (Map<String, Object> row :
                    rows) {

                Row excelRow =
                        sheet.createRow(
                                rowNumber++
                        );

                column = 0;

                for (String key :
                        firstRow.keySet()) {

                    Object value =
                            row.get(key);

                    excelRow
                            .createCell(column++)
                            .setCellValue(
                                    value == null
                                            ? ""
                                            : String.valueOf(
                                                    value
                                            )
                            );
                }
            }

            // ==================================
            // AUTO SIZE
            // ==================================

            for (int i = 0;
                 i < firstRow.size();
                 i++) {

                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream output =
                    new ByteArrayOutputStream();

            workbook.write(output);

            workbook.close();

            return output.toByteArray();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Excel generation failed",
                    e
            );
        }
    }
}