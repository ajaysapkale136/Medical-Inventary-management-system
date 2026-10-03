package com.v.medical.Service;

import com.v.medical.entity.*;
import com.v.medical.repository.*;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ReportDataService {

    private final InventoryRepository inventoryRepository;
    private final MedicineRepository medicineRepository;
    private final BatchRepository batchRepository;
    private final StockLogRepository stockLogRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;

    public ReportDataService(
            InventoryRepository inventoryRepository,
            MedicineRepository medicineRepository,
            BatchRepository batchRepository,
            StockLogRepository stockLogRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            SupplierRepository supplierRepository,
            UserRepository userRepository) {
        this.inventoryRepository = inventoryRepository;
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
        this.stockLogRepository = stockLogRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.supplierRepository = supplierRepository;
        this.userRepository = userRepository;
    }

    public List<Map<String, Object>> getReportData(
            ReportType type,
            LocalDate fromDate,
            LocalDate toDate) {

        return switch (type) {
            case INVENTORY -> inventoryReport();
            case STOCK_SUMMARY -> stockSummaryReport();
            case STOCK_MOVEMENT -> stockMovementReport();
            case EXPIRY, EXPIRY_ANALYSIS -> expiryReport();
            case PURCHASE_ORDER -> purchaseReport();
            case SUPPLIER, SUPPLIER_SUMMARY -> supplierReport();
            case USER_ACTIVITY -> userActivityReport();
            case FINANCIAL -> financialReport();
            case AUDIT -> auditReport();
            case INVENTORY_VALUATION -> inventoryValuationReport();
        };
    }

    // ==========================================
    // INVENTORY
    // ==========================================
    public List<Map<String, Object>> inventoryReport() {
        List<Inventory> items = inventoryRepository.findAll();
        List<Map<String, Object>> rows = new ArrayList<>();

        for (Inventory item : items) {
            Map<String, Object> map = new LinkedHashMap<>();
            Medicine med = item.getMedicine();
            Batch batch = item.getBatch();
            int qty = item.getQuantity() != null ? item.getQuantity() : 0;
            BigDecimal price = (med != null && med.getPrice() != null) ? med.getPrice() : BigDecimal.ZERO;
            BigDecimal totalVal = price.multiply(BigDecimal.valueOf(qty));

            map.put("Medicine", med != null ? med.getName() : "N/A");
            map.put("Batch No", batch != null ? batch.getBatchNumber() : "-");
            map.put("Category", (med != null && med.getCategory() != null) ? med.getCategory().getName() : "General");
            map.put("Quantity", qty);
            map.put("Unit", med != null ? med.getUnit() : "Units");
            map.put("Price (INR)", price);
            map.put("Valuation (INR)", totalVal);
            map.put("Expiry Date", (batch != null && batch.getExpiryDate() != null) ? batch.getExpiryDate().toString() : "-");
            map.put("Status", qty <= 0 ? "Out of Stock" : (qty <= 15 ? "Low Stock" : "In Stock"));
            rows.add(map);
        }
        return rows;
    }

    // ==========================================
    // STOCK SUMMARY
    // ==========================================
    public List<Map<String, Object>> stockSummaryReport() {
        return inventoryReport();
    }

    // ==========================================
    // STOCK MOVEMENT
    // ==========================================
    public List<Map<String, Object>> stockMovementReport() {
        List<StockLog> logs = stockLogRepository.findAll();
        List<Map<String, Object>> rows = new ArrayList<>();

        for (StockLog log : logs) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("Log ID", log.getId());
            String medName = "N/A";
            if (log.getMedicine() != null) {
                medName = log.getMedicine().getName();
            } else if (log.getInventory() != null && log.getInventory().getMedicine() != null) {
                medName = log.getInventory().getMedicine().getName();
            }
            map.put("Medicine", medName);
            map.put("Action", log.getOperation() != null ? log.getOperation().name() : "UPDATE");
            map.put("Quantity", log.getQuantity() != null ? log.getQuantity() : 0);
            map.put("Previous Qty", log.getPreviousQuantity() != null ? log.getPreviousQuantity() : 0);
            map.put("New Qty", log.getNewQuantity() != null ? log.getNewQuantity() : 0);
            map.put("Reason", log.getReason() != null ? log.getReason() : "-");
            map.put("Performed By", log.getPerformedBy() != null ? log.getPerformedBy() : "Staff");
            map.put("Date Time", log.getCreatedAt() != null ? log.getCreatedAt().toString().replace("T", " ") : "-");
            rows.add(map);
        }
        return rows;
    }

    // ==========================================
    // EXPIRY
    // ==========================================
    public List<Map<String, Object>> expiryReport() {
        List<Batch> batches = batchRepository.findAll();
        List<Map<String, Object>> rows = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (Batch b : batches) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("Batch Number", b.getBatchNumber());
            map.put("Medicine", b.getMedicine() != null ? b.getMedicine().getName() : "N/A");
            map.put("Stock Quantity", b.getQuantity() != null ? b.getQuantity() : 0);
            map.put("Mfg Date", b.getManufacturingDate() != null ? b.getManufacturingDate().toString() : "-");
            map.put("Expiry Date", b.getExpiryDate() != null ? b.getExpiryDate().toString() : "-");

            long days = b.getExpiryDate() != null ? ChronoUnit.DAYS.between(today, b.getExpiryDate()) : 999;
            map.put("Days Left", days);
            String status = days < 0 ? "EXPIRED" : (days <= 30 ? "CRITICAL (<30d)" : (days <= 90 ? "WARNING (<90d)" : "SAFE"));
            map.put("Status", status);
            rows.add(map);
        }
        return rows;
    }

    // ==========================================
    // PURCHASE
    // ==========================================
    public List<Map<String, Object>> purchaseReport() {
        List<PurchaseOrder> orders = purchaseOrderRepository.findAll();
        List<Map<String, Object>> rows = new ArrayList<>();

        for (PurchaseOrder po : orders) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("PO Number", po.getPoNumber());
            map.put("Supplier", po.getSupplier() != null ? po.getSupplier().getCompanyName() : "N/A");
            map.put("Order Date", po.getOrderDate() != null ? po.getOrderDate().toString() : "-");
            map.put("Expected Date", po.getExpectedDate() != null ? po.getExpectedDate().toString() : "-");
            BigDecimal total = po.getTotalAmount() != null ? po.getTotalAmount() : (po.getSubtotal() != null ? po.getSubtotal() : BigDecimal.ZERO);
            map.put("Total (INR)", total);
            map.put("Status", po.getStatus() != null ? po.getStatus().name() : "DRAFT");
            map.put("Created By", po.getCreatedBy() != null ? po.getCreatedBy() : "Admin");
            rows.add(map);
        }
        return rows;
    }

    // ==========================================
    // SUPPLIER
    // ==========================================
    public List<Map<String, Object>> supplierReport() {
        List<Supplier> suppliers = supplierRepository.findAll();
        List<Map<String, Object>> rows = new ArrayList<>();

        for (Supplier s : suppliers) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("Company Name", s.getCompanyName());
            map.put("Contact Person", s.getContactPerson() != null ? s.getContactPerson() : "-");
            map.put("Phone", s.getPhone());
            map.put("Email", s.getEmail() != null ? s.getEmail() : "-");
            map.put("Type", s.getSupplierType() != null ? s.getSupplierType() : "Distributor");
            map.put("Outstanding (INR)", s.getOutstandingBalance() != null ? s.getOutstandingBalance() : BigDecimal.ZERO);
            map.put("Total Purchases (INR)", s.getTotalPurchaseAmount() != null ? s.getTotalPurchaseAmount() : BigDecimal.ZERO);
            map.put("Status", s.getStatus() != null ? s.getStatus().name() : "ACTIVE");
            rows.add(map);
        }
        return rows;
    }

    // ==========================================
    // USER ACTIVITY
    // ==========================================
    public List<Map<String, Object>> userActivityReport() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> rows = new ArrayList<>();

        for (User u : users) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("User ID", u.getId());
            map.put("Full Name", u.getName() != null ? u.getName() : u.getUsername());
            map.put("Email", u.getEmail());
            map.put("Role", u.getRole() != null ? u.getRole().name() : "STAFF");
            map.put("Status", u.isActive() ? "ACTIVE" : "INACTIVE");
            map.put("Created At", u.getJoinedAt() != null ? u.getJoinedAt().toString() : "-");
            rows.add(map);
        }
        return rows;
    }

    // ==========================================
    // FINANCIAL
    // ==========================================
    public List<Map<String, Object>> financialReport() {
        List<Map<String, Object>> rows = new ArrayList<>();
        BigDecimal totalStockValuation = BigDecimal.ZERO;
        for (Inventory item : inventoryRepository.findAll()) {
            Medicine med = item.getMedicine();
            int qty = item.getQuantity() != null ? item.getQuantity() : 0;
            BigDecimal price = (med != null && med.getPrice() != null) ? med.getPrice() : BigDecimal.ZERO;
            totalStockValuation = totalStockValuation.add(price.multiply(BigDecimal.valueOf(qty)));
        }

        BigDecimal totalPayable = BigDecimal.ZERO;
        for (Supplier s : supplierRepository.findAll()) {
            if (s.getOutstandingBalance() != null) {
                totalPayable = totalPayable.add(s.getOutstandingBalance());
            }
        }

        BigDecimal totalPoValue = BigDecimal.ZERO;
        for (PurchaseOrder po : purchaseOrderRepository.findAll()) {
            if (po.getTotalAmount() != null) {
                totalPoValue = totalPoValue.add(po.getTotalAmount());
            } else if (po.getSubtotal() != null) {
                totalPoValue = totalPoValue.add(po.getSubtotal());
            }
        }

        Map<String, Object> r1 = new LinkedHashMap<>();
        r1.put("Category", "Total Physical Inventory Valuation");
        r1.put("Amount (INR)", totalStockValuation);
        r1.put("Notes", "Based on current batch stock units and unit prices");
        rows.add(r1);

        Map<String, Object> r2 = new LinkedHashMap<>();
        r2.put("Category", "Total Supplier Outstanding Payables");
        r2.put("Amount (INR)", totalPayable);
        r2.put("Notes", "Pending liabilities across all active suppliers");
        rows.add(r2);

        Map<String, Object> r3 = new LinkedHashMap<>();
        r3.put("Category", "Total Purchase Order Commitments");
        r3.put("Amount (INR)", totalPoValue);
        r3.put("Notes", "Cumulative value of recorded purchase orders");
        rows.add(r3);

        return rows;
    }

    // ==========================================
    // AUDIT
    // ==========================================
    public List<Map<String, Object>> auditReport() {
        return stockMovementReport();
    }

    // ==========================================
    // INVENTORY VALUATION
    // ==========================================
    public List<Map<String, Object>> inventoryValuationReport() {
        return inventoryReport();
    }
}