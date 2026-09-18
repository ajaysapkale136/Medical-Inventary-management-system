package com.medistock.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.medistock.entity.Medicine;
import com.medistock.entity.Sale;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;

/** Builds Excel (.xlsx) and PDF exports of the inventory. */
@Service
@RequiredArgsConstructor
public class ReportService {

    private static final String[] HEADERS =
            {"ID", "Name", "Batch", "Category", "Supplier", "Quantity", "Mfg Date", "Expiry Date", "Price"};

    /* ---------------- Excel ---------------- */
    public byte[] toExcel(List<Medicine> medicines, String sheetName) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(sheetName);

            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row header = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Medicine m : medicines) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(m.getId() == null ? 0 : m.getId());
                row.createCell(1).setCellValue(m.getName());
                row.createCell(2).setCellValue(m.getBatchNumber());
                row.createCell(3).setCellValue(m.getCategory() == null ? "-" : m.getCategory().getName());
                row.createCell(4).setCellValue(m.getSupplier() == null ? "-" : m.getSupplier().getName());
                row.createCell(5).setCellValue(m.getQuantity() == null ? 0 : m.getQuantity());
                row.createCell(6).setCellValue(String.valueOf(m.getManufacturingDate()));
                row.createCell(7).setCellValue(String.valueOf(m.getExpiryDate()));
                row.createCell(8).setCellValue(m.getPrice() == null ? 0 : m.getPrice().doubleValue());
            }

            for (int i = 0; i < HEADERS.length; i++) sheet.autoSizeColumn(i);

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception ex) {
            throw new RuntimeException("Could not generate Excel report: " + ex.getMessage(), ex);
        }
    }

    public byte[] toSalePdf(Sale sale) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(new Paragraph("MediStock Bill", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18)));
            document.add(new Paragraph("Bill #: " + sale.getId()));
            document.add(new Paragraph("Customer: " + sale.getCustomerName()));
            document.add(new Paragraph("Phone: " + (sale.getCustomerPhone() == null ? "-" : sale.getCustomerPhone())));
            document.add(new Paragraph("Sold by: " + sale.getSoldBy()));
            document.add(new Paragraph("Date: " + sale.getCreatedAt()));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(new float[]{3.5f, 1.2f, 1.8f, 2.4f});
            table.setWidthPercentage(100);
            table.addCell(headerCell("Medicine"));
            table.addCell(headerCell("Qty"));
            table.addCell(headerCell("Unit"));
            table.addCell(headerCell("Line Total"));

            for (var item : sale.getItems()) {
                table.addCell(item.getMedicineName());
                table.addCell(String.valueOf(item.getQuantity()));
                table.addCell(String.valueOf(item.getUnitPrice()));
                table.addCell(String.valueOf(item.getLineTotal()));
            }

            document.add(table);
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Grand Total: " + sale.getTotal(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            document.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new RuntimeException("Could not generate sale bill PDF: " + ex.getMessage(), ex);
        }
    }

    private PdfPCell headerCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        return cell;
    }

    /* ---------------- PDF ---------------- */
    public byte[] toPdf(List<Medicine> medicines, String title) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 24, 24, 24, 24);
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(new Paragraph(title, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16)));
            document.add(new Paragraph("Generated by MediStock\n\n"));

            PdfPTable table = new PdfPTable(HEADERS.length);
            table.setWidthPercentage(100);
            for (String h : HEADERS) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
                table.addCell(cell);
            }

            for (Medicine m : medicines) {
                table.addCell(String.valueOf(m.getId()));
                table.addCell(m.getName());
                table.addCell(m.getBatchNumber());
                table.addCell(m.getCategory() == null ? "-" : m.getCategory().getName());
                table.addCell(m.getSupplier() == null ? "-" : m.getSupplier().getName());
                table.addCell(String.valueOf(m.getQuantity()));
                table.addCell(String.valueOf(m.getManufacturingDate()));
                table.addCell(String.valueOf(m.getExpiryDate()));
                table.addCell(String.valueOf(m.getPrice()));
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new RuntimeException("Could not generate PDF report: " + ex.getMessage(), ex);
        }
    }
}
