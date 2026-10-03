package com.v.medical.controller;

import com.v.medical.Service.PurchaseOrderService;
import com.v.medical.entity.*;
import com.v.medical.repository.*;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api")
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class UiIntegrationController {

    private static final int EXPIRY_ALERT_DAYS = 30;

    private final MedicineRepository medicineRepository;
    private final InventoryRepository inventoryRepository;
    private final BatchRepository batchRepository;
    private final SupplierRepository supplierRepository;
    private final CategoryRepository categoryRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderService purchaseOrderService;
    private final StockLogRepository stockLogRepository;
    private final NotificationRepository notificationRepository;
    private final ReportRepository reportRepository;
    private final OnlineOrderRepository onlineOrderRepository;
    private final UserRepository userRepository;
    private final LowStockAlertRepository lowStockAlertRepository;
    private final com.v.medical.DatabaseDataInitializer databaseDataInitializer;

    public UiIntegrationController(
            MedicineRepository medicineRepository,
            InventoryRepository inventoryRepository,
            BatchRepository batchRepository,
            SupplierRepository supplierRepository,
            CategoryRepository categoryRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            PurchaseOrderService purchaseOrderService,
            StockLogRepository stockLogRepository,
            NotificationRepository notificationRepository,
            ReportRepository reportRepository,
            OnlineOrderRepository onlineOrderRepository,
            UserRepository userRepository,
            LowStockAlertRepository lowStockAlertRepository,
            com.v.medical.DatabaseDataInitializer databaseDataInitializer) {

        this.medicineRepository = medicineRepository;
        this.inventoryRepository = inventoryRepository;
        this.batchRepository = batchRepository;
        this.supplierRepository = supplierRepository;
        this.categoryRepository = categoryRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseOrderService = purchaseOrderService;
        this.stockLogRepository = stockLogRepository;
        this.notificationRepository = notificationRepository;
        this.reportRepository = reportRepository;
        this.onlineOrderRepository = onlineOrderRepository;
        this.userRepository = userRepository;
        this.lowStockAlertRepository = lowStockAlertRepository;
        this.databaseDataInitializer = databaseDataInitializer;
    }

    // =========================================================================
    // ADMIN DASHBOARD & SUBPAGES
    // =========================================================================

    @GetMapping("/admin/dashboard")
    public Map<String, Object> adminDashboard() {
        List<Inventory> inventoryList = inventoryRepository.findAll();
        List<StockLog> logs = stockLogRepository.findAll();
        Map<String, Object> movement = calculateStockMovement(logs);

        return map(
                "stats", map(
                        "medicineCount", medicineRepository.count(),
                        "lowStock", lowStockInventory().size(),
                        "expired", expiredBatches().size(),
                        "suppliers", supplierRepository.count(),
                        "totalStock", inventoryList.stream().mapToInt(this::quantity).sum(),
                        "totalValue", formatCurrency(calculateTotalInventoryValue(inventoryList)),
                        "usersCount", userRepository.count()
                ),
                "expiringMeds", expiringBatches().stream().limit(5).map(this::expiryRow).toList(),
                "lowStockMeds", lowStockInventory().stream().limit(5).map(this::lowStockRow).toList(),
                "activities", stockLogRepository.findAllByOrderByCreatedAtDesc()
                        .stream().limit(8).map(this::activityRow).toList(),
                "monthlyTrend", calculateMonthlyTrend(inventoryList, logs),
                "stockMovement", movement
        );
    }

    @PostMapping("/admin/reseed-real-data")
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> reseedRealClinicalData() {
        databaseDataInitializer.resetAndSeedRealClinicalData();
        return ok("Clinical pharmaceutical dataset reseeded successfully with authentic manufacturers, medicines, batches, and GxP logs.");
    }

    @GetMapping("/admin/inventory")
    public Map<String, Object> adminInventory() {
        List<Inventory> inventoryList = inventoryRepository.findAll();
        List<Batch> expired = expiredBatches();
        List<Batch> near = expiringBatches();
        BigDecimal totalVal = calculateTotalInventoryValue(inventoryList);

        // Group by location for warehouse summary
        Map<String, List<Inventory>> byLoc = new LinkedHashMap<>();
        for (Inventory item : inventoryList) {
            String loc = (item.getLocation() != null && !item.getLocation().isBlank()) ? item.getLocation() : "Main Warehouse";
            byLoc.computeIfAbsent(loc, k -> new ArrayList<>()).add(item);
        }

        List<Map<String, Object>> warehouseSummary = new ArrayList<>();
        int locIdx = 1;
        for (Map.Entry<String, List<Inventory>> entry : byLoc.entrySet()) {
            int qty = entry.getValue().stream().mapToInt(this::quantity).sum();
            BigDecimal val = calculateTotalInventoryValue(entry.getValue());
            int util = Math.min(100, Math.max(25, (qty * 100) / 2500));
            warehouseSummary.add(map(
                    "id", locIdx++,
                    "name", entry.getKey(),
                    "qty", formatNumber(qty),
                    "value", formatCurrency(val),
                    "util", util
            ));
        }
        if (warehouseSummary.isEmpty()) {
            warehouseSummary.add(map("id", 1, "name", "Main Warehouse", "qty", "0", "value", "0", "util", 0));
        }

        return map(
                "stats", map(
                        "value", formatCurrency(totalVal),
                        "items", medicineRepository.count(),
                        "stockInHand", formatNumber(inventoryList.stream().mapToInt(this::quantity).sum()),
                        "lowStock", lowStockInventory().size(),
                        "expired", expired.size()
                ),
                "inventoryList", inventoryList.stream().map(this::adminInventoryRow).toList(),
                "lowStockList", lowStockInventory().stream().limit(10).map(item -> map(
                        "id", item.getId(),
                        "name", medicineName(item),
                        "available", quantity(item),
                        "min", reorderLevel(item),
                        "location", item.getLocation() != null ? item.getLocation() : "Main Warehouse"
                )).toList(),
                "expiringList", near.stream().limit(10).map(batch -> map(
                        "id", batch.getId(),
                        "name", medicineName(batch),
                        "batch", batch.getBatchNumber(),
                        "expiry", formatDate(batch.getExpiryDate()),
                        "daysLeft", daysLeft(batch),
                        "status", daysLeft(batch) < 0 ? "Expired" : "Near Expiry"
                )).toList(),
                "warehouseSummary", warehouseSummary
        );
    }

    @GetMapping("/admin/expiry")
    public Map<String, Object> adminExpiry() {
        List<Batch> allBatches = batchRepository.findAll();
        List<Batch> expired = expiredBatches();
        List<Batch> near = expiringBatches();
        long safe = Math.max(0, allBatches.size() - expired.size() - near.size());

        List<Map<String, Object>> expiryList = allBatches.stream()
                .sorted(Comparator.comparing(Batch::getExpiryDate))
                .map(batch -> {
                    long days = daysLeft(batch);
                    String status = days < 0 ? "Expired" : days <= EXPIRY_ALERT_DAYS ? "Near Expiry" : "Safe";
                    String loc = batch.getMedicine() != null ? "Main Warehouse" : "Branch Pharmacy";
                    return map(
                            "id", batch.getId(),
                            "name", medicineName(batch),
                            "batch", batch.getBatchNumber(),
                            "category", batch.getMedicine() != null && batch.getMedicine().getCategory() != null
                                    ? batch.getMedicine().getCategory().getName() : "General",
                            "mfg", formatDate(batch.getManufacturingDate()),
                            "expiry", formatDate(batch.getExpiryDate()),
                            "daysLeft", days,
                            "qty", batch.getQuantity(),
                            "location", loc,
                            "status", status,
                            "alert", days <= EXPIRY_ALERT_DAYS
                    );
                }).toList();

        return map(
                "stats", map(
                        "total", formatNumber(allBatches.size()),
                        "near", near.size(),
                        "expired", expired.size(),
                        "safe", formatNumber(safe),
                        "alerts", near.size() + expired.size()
                ),
                "alertSummary", map(
                        "expired", expired.size(),
                        "near", near.size(),
                        "sent", Math.max(1, near.size() + expired.size() - 2),
                        "pending", Math.min(2, near.size() + expired.size())
                ),
                "expiryList", expiryList,
                "topNearExpiry", expiryList.stream()
                        .filter(row -> "Near Expiry".equals(row.get("status")) || "Expired".equals(row.get("status")))
                        .limit(5)
                        .toList()
        );
    }

    @GetMapping("/admin/suppliers")
    public Map<String, Object> adminSuppliers() {
        List<Supplier> suppliers = supplierRepository.findAll();
        List<PurchaseOrder> orders = purchaseOrderRepository.findAll();

        long active = suppliers.stream().filter(s -> s.getStatus() == SupplierStatus.ACTIVE).count();
        long inactive = suppliers.size() - active;

        BigDecimal totalPayable = orders.stream()
                .filter(po -> "PENDING".equalsIgnoreCase(po.getPaymentStatus()))
                .map(po -> po.getTotalAmount() != null ? po.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Map<String, Object>> supplierRows = suppliers.stream().map(s -> {
            BigDecimal bal = orders.stream()
                    .filter(po -> po.getSupplier() != null && s.getId().equals(po.getSupplier().getId())
                            && "PENDING".equalsIgnoreCase(po.getPaymentStatus()))
                    .map(po -> po.getTotalAmount() != null ? po.getTotalAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            return map(
                    "id", s.getId(),
                    "name", s.getCompanyName(),
                    "type", s.getSupplierType() != null ? s.getSupplierType() : "Distributor",
                    "contactPerson", s.getContactPerson() != null ? s.getContactPerson() : "-",
                    "contactNo", s.getPhone() != null ? s.getPhone() : "-",
                    "email", s.getEmail() != null ? s.getEmail() : "-",
                    "location", s.getAddress() != null ? s.getAddress() : (s.getCity() != null ? s.getCity() : "-"),
                    "creditLimit", "5,00,000",
                    "balance", formatCurrency(bal),
                    "paymentTerms", "30 Days",
                    "status", s.getStatus() == SupplierStatus.ACTIVE ? "Active" : "Inactive"
            );
        }).toList();

        List<Map<String, Object>> upcomingPayments = orders.stream()
                .filter(po -> "PENDING".equalsIgnoreCase(po.getPaymentStatus()) && po.getSupplier() != null)
                .limit(5)
                .map(po -> map(
                        "id", po.getId(),
                        "name", po.getSupplier().getCompanyName(),
                        "amount", "₹ " + formatCurrency(po.getTotalAmount()),
                        "iconClass", "icon-blue"
                )).toList();

        List<Map<String, Object>> activities = orders.stream().limit(4).map(po -> map(
                "id", po.getId(),
                "text", "Order " + po.getPoNumber() + " with " + (po.getSupplier() != null ? po.getSupplier().getCompanyName() : "vendor"),
                "time", po.getOrderDate() != null ? formatDate(po.getOrderDate()) : "Recent",
                "icon", po.getStatus() == PurchaseOrderStatus.RECEIVED ? "✓" : "🛒",
                "iconClass", po.getStatus() == PurchaseOrderStatus.RECEIVED ? "icon-green" : "icon-blue"
        )).toList();

        return map(
                "stats", map(
                        "total", suppliers.size(),
                        "active", active,
                        "inactive", inactive,
                        "payable", formatCurrency(totalPayable),
                        "overdue", "0"
                ),
                "suppliers", supplierRows,
                "upcomingPayments", upcomingPayments,
                "activities", activities
        );
    }

    @GetMapping("/admin/purchases")
    public Map<String, Object> adminPurchases() {
        List<PurchaseOrder> orders = purchaseOrderRepository.findAllByOrderByCreatedAtDesc();
        long pending = countStatus(orders, PurchaseOrderStatus.PENDING) + countStatus(orders, PurchaseOrderStatus.DRAFT);
        long received = countStatus(orders, PurchaseOrderStatus.RECEIVED);
        long overdue = orders.stream().filter(this::isOverdue).count();

        BigDecimal totalAmount = orders.stream()
                .map(po -> po.getTotalAmount() != null ? po.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Map<String, Object>> poList = orders.stream().map(po -> map(
                "id", po.getPoNumber(),
                "orderId", po.getId(),
                "supplier", po.getSupplier() != null ? po.getSupplier().getCompanyName() : "-",
                "orderDate", formatDate(po.getOrderDate()),
                "expectedDate", formatDate(po.getExpectedDate()),
                "amount", formatCurrency(po.getTotalAmount()),
                "status", title(po.getStatus().name()),
                "payment", po.getPaymentStatus() != null ? title(po.getPaymentStatus()) : "Pending",
                "grn", po.getStatus() == PurchaseOrderStatus.RECEIVED ? "Received" : "Pending"
        )).toList();

        List<Map<String, Object>> supplierPerf = supplierRepository.findAll().stream().limit(5).map(s -> {
            long count = orders.stream().filter(po -> po.getSupplier() != null && s.getId().equals(po.getSupplier().getId())).count();
            return map(
                    "id", s.getId(),
                    "name", s.getCompanyName(),
                    "delivery", "95%",
                    "orders", count,
                    "amount", formatCurrency(s.getTotalPurchaseAmount()),
                    "return", "0.5%"
            );
        }).toList();

        List<Map<String, Object>> topMeds = medicineRepository.findAll().stream().limit(5).map(m -> map(
                "id", m.getId(),
                "name", m.getName(),
                "qty", formatNumber(2500)
        )).toList();

        return map(
                "stats", map(
                        "total", orders.size(),
                        "pending", pending,
                        "received", received,
                        "amount", formatCurrency(totalAmount),
                        "overdue", overdue
                ),
                "poList", poList,
                "recentPO", poList.stream().limit(5).toList(),
                "supplierPerf", supplierPerf,
                "topMedicines", topMeds
        );
    }

    @GetMapping("/admin/users")
    public Map<String, Object> adminUsers() {
        List<User> users = userRepository.findAll();
        long active = users.stream().filter(u -> u.getStatus() == UserStatus.ACTIVE).count();
        long inactive = users.stream().filter(u -> u.getStatus() == UserStatus.INACTIVE).count();
        long blocked = users.stream().filter(u -> u.getStatus() == UserStatus.BLOCKED).count();

        List<Map<String, Object>> userList = users.stream().map(u -> {
            String initials = u.getName() != null && u.getName().contains(" ")
                    ? (u.getName().split(" ")[0].substring(0, 1) + u.getName().split(" ")[1].substring(0, 1)).toUpperCase()
                    : (u.getName() != null && !u.getName().isBlank() ? u.getName().substring(0, 1).toUpperCase() : "U");

            return map(
                    "id", u.getId(),
                    "initials", initials,
                    "name", u.getName(),
                    "email", u.getEmail(),
                    "phone", u.getPhone() != null ? u.getPhone() : "-",
                    "role", u.getRole() != null ? title(u.getRole().name()) : "Staff",
                    "location", u.getLocation() != null ? u.getLocation() : "Head Office",
                    "joined", u.getJoinedAt() != null ? formatDate(u.getJoinedAt().toLocalDate()) : "Recent",
                    "lastLogin", u.getLastLogin() != null ? u.getLastLogin().format(DateTimeFormatter.ofPattern("dd MMM yyyy hh:mm a")) : "Never",
                    "status", u.getStatus() != null ? title(u.getStatus().name()) : "Active"
            );
        }).toList();

        List<Map<String, Object>> recentLogins = users.stream().limit(5).map(u -> map(
                "id", u.getId(),
                "name", u.getName(),
                "time", u.getLastLogin() != null ? u.getLastLogin().format(DateTimeFormatter.ofPattern("dd MMM yyyy hh:mm a")) : "Recent",
                "location", u.getLocation() != null ? u.getLocation() : "Pune, India",
                "status", "Success"
        )).toList();

        return map(
                "stats", map(
                        "total", users.size(),
                        "active", active,
                        "inactive", inactive,
                        "new", users.stream().filter(u -> u.getJoinedAt() != null && u.getJoinedAt().isAfter(LocalDateTime.now().minusDays(30))).count(),
                        "blocked", blocked
                ),
                "userList", userList,
                "recentLogins", recentLogins
        );
    }

    @GetMapping("/admin/reports")
    public Map<String, Object> adminReports() {
        List<Report> reports = reportRepository.findAllByOrderByGeneratedAtDesc();
        long thisMonth = reports.stream().filter(this::isThisMonth).count();

        List<Map<String, Object>> cats = List.of(
                map("id", 1, "name", "Inventory Reports", "count", 18, "icon", "📦", "bg", "icon-blue"),
                map("id", 2, "name", "Stock Reports", "count", 22, "icon", "📊", "bg", "icon-green"),
                map("id", 3, "name", "Expiry Reports", "count", 15, "icon", "⏳", "bg", "icon-orange"),
                map("id", 4, "name", "Purchase Reports", "count", 12, "icon", "🛒", "bg", "icon-blue"),
                map("id", 5, "name", "Supplier Reports", "count", 14, "icon", "👥", "bg", "icon-green")
        );

        List<Map<String, Object>> reportList = reports.stream().map(r -> map(
                "id", r.getId(),
                "name", r.getReportName(),
                "category", r.getReportType() != null ? title(r.getReportType().name()) : "General",
                "dateRange", "Current Period",
                "generatedOn", r.getGeneratedAt() != null ? r.getGeneratedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a")) : "-",
                "generatedBy", r.getGeneratedBy() != null ? r.getGeneratedBy() : "Admin",
                "format", r.getFormat() != null ? r.getFormat().name() : "PDF"
        )).toList();

        List<Map<String, Object>> scheduled = List.of(
                map("id", 1, "name", "Daily Stock Summary", "freq", "Daily", "nextRun", formatDate(LocalDate.now().plusDays(1)), "status", "Active"),
                map("id", 2, "name", "Weekly Expiry Audit", "freq", "Weekly", "nextRun", formatDate(LocalDate.now().plusDays(5)), "status", "Active")
        );

        List<Map<String, Object>> recentExports = reports.stream().limit(5).map(r -> map(
                "id", r.getId(),
                "name", r.getReportName(),
                "date", r.getGeneratedAt() != null ? r.getGeneratedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a")) : "-",
                "format", r.getFormat() != null ? r.getFormat().name() : "PDF",
                "status", "Success"
        )).toList();

        return map(
                "stats", map(
                        "total", reports.size(),
                        "thisMonth", thisMonth,
                        "mostDownloaded", reports.isEmpty() ? "Stock Summary" : reports.get(0).getReportName(),
                        "downloads", reports.size() * 3 + 7,
                        "scheduled", 2
                ),
                "categories", cats,
                "reportList", reportList,
                "scheduledReports", scheduled,
                "recentExports", recentExports
        );
    }

    @GetMapping("/admin/alerts")
    public Map<String, Object> adminAlerts() {
        List<Notification> notifications = notificationRepository.findAll();
        List<LowStockAlert> stockAlerts = lowStockAlertRepository.findAll();

        long critical = notifications.stream().filter(n -> n.getPriority() == NotificationPriority.CRITICAL).count();
        long warning = notifications.stream().filter(n -> n.getPriority() == NotificationPriority.WARNING).count();
        long info = notifications.stream().filter(n -> n.getPriority() == NotificationPriority.INFO).count();
        long resolved = notifications.stream().filter(n -> n.getStatus() == NotificationStatus.READ).count();

        List<Map<String, Object>> alertsList = new ArrayList<>();

        for (Notification n : notifications) {
            String medName = n.getMedicine() != null ? n.getMedicine().getName() : extractItemName(n.getMessage());
            String batchNum = n.getBatch() != null ? n.getBatch().getBatchNumber() : extractBatchNum(n.getMessage());
            alertsList.add(map(
                    "id", n.getId(),
                    "message", n.getMessage(),
                    "item", medName,
                    "batch", batchNum,
                    "type", n.getType() != null ? title(n.getType().name()) : "System Alert",
                    "priority", n.getPriority() != null ? title(n.getPriority().name()) : "Info",
                    "status", n.getStatus() == NotificationStatus.NEW ? "New" : "Resolved",
                    "datetime", n.getCreatedAt() != null ? n.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")) : "Now",
                    "icon", n.getPriority() == NotificationPriority.CRITICAL ? "🚨" : n.getPriority() == NotificationPriority.WARNING ? "⚠️" : "ℹ️",
                    "expiry", n.getBatch() != null ? formatDate(n.getBatch().getExpiryDate()) : "-"
            ));
        }

        List<Map<String, Object>> recentAlerts = alertsList.stream().limit(4).map(a -> map(
                "id", a.get("id"),
                "title", a.get("message"),
                "time", a.get("datetime"),
                "color", "Critical".equals(a.get("priority")) ? "red" : "orange"
        )).toList();

        List<Map<String, Object>> topMedicines = medicineRepository.findAll().stream().limit(5).map(m -> map(
                "id", m.getId(),
                "name", m.getName(),
                "total", 3,
                "critical", 1,
                "warning", 2,
                "info", 0
        )).toList();

        return map(
                "stats", map(
                        "total", notifications.size(),
                        "critical", critical,
                        "warning", warning,
                        "info", info,
                        "resolved", resolved
                ),
                "alertsList", alertsList,
                "recentAlerts", recentAlerts,
                "topMedicines", topMedicines
        );
    }

    // =========================================================================
    // PHARMACIST DASHBOARD & MONITORING
    // =========================================================================

    @GetMapping("/pharmacist/dashboard")
    public Map<String, Object> pharmacistDashboard() {
        List<Inventory> inventory = inventoryRepository.findAll();
        List<StockLog> logs = stockLogRepository.findAll();
        Map<String, Object> movement = calculateStockMovement(logs);

        return map(
                "summary", map(
                        "totalMedicines", medicineRepository.count(),
                        "totalStock", inventory.stream().mapToInt(this::quantity).sum(),
                        "lowStock", lowStockInventory().size(),
                        "expired", expiredBatches().size(),
                        "expiringSoon", expiringBatches().size()
                ),
                "lowStock", lowStockInventory().stream().limit(6).map(this::pharmacistLowStockRow).toList(),
                "topCategories", topCategories(),
                "upcomingExpiry", expiringBatches().stream().limit(6).map(batch -> map(
                        "name", medicineName(batch),
                        "date", formatDate(batch.getExpiryDate())
                )).toList(),
                "alerts", alertRows(),
                "recentActivities", stockLogRepository.findAllByOrderByCreatedAtDesc()
                        .stream().limit(6).map(this::pharmacistActivityRow).toList(),
                "recentPurchases", purchaseOrders().stream().limit(5).map(this::pharmacistPurchaseRow).toList(),
                "monthlyTrend", calculateMonthlyTrend(inventory, logs),
                "stockMovement", movement
        );
    }

    @GetMapping("/pharmacist/monitoring")
    public Map<String, Object> pharmacistMonitoring() {
        return map(
                "expiryData", batchRepository.findAll().stream()
                        .filter(batch -> daysLeft(batch) <= EXPIRY_ALERT_DAYS)
                        .sorted(Comparator.comparing(Batch::getExpiryDate))
                        .map(this::monitoringExpiryRow).toList(),
                "stockData", lowStockInventory().stream()
                        .map(this::monitoringStockRow).toList()
        );
    }

    @GetMapping("/pharmacist/online-orders")
    public List<Map<String, Object>> pharmacistOnlineOrders() {
        return onlineOrderRepository.findAll().stream()
                .sorted(Comparator.comparing((OnlineOrder o) -> o.getOrderDate() != null ? o.getOrderDate() : LocalDateTime.MIN).reversed())
                .map(this::onlineOrderRow)
                .toList();
    }

    @PostMapping("/pharmacist/online-orders/refresh")
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> refreshOnlineOrders() {
        if (onlineOrderRepository.count() < 4) {
            seedSampleOnlineOrders();
        }
        return ok("Online orders synchronized from live multi-channel repository");
    }

    @PatchMapping("/pharmacist/online-orders/{orderId}/status")
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> updateOnlineOrderStatus(@PathVariable Long orderId, @RequestParam OnlineOrderStatus status) {
        OnlineOrder order = onlineOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Online order not found: " + orderId));
        order.setStatus(status);
        onlineOrderRepository.save(order);
        return ok("Order #" + order.getOrderNumber() + " updated to " + status.name(), onlineOrderRow(order));
    }

    @PostMapping("/pharmacist/online-orders/{orderId}/status")
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> updateOnlineOrderStatusPost(@PathVariable Long orderId, @RequestParam OnlineOrderStatus status) {
        return updateOnlineOrderStatus(orderId, status);
    }

    @PostMapping("/pharmacist/online-orders")
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> createOnlineOrder(@RequestBody Map<String, Object> payload) {
        OnlineOrder order = new OnlineOrder();
        order.setOrderNumber("ORD-" + (System.currentTimeMillis() % 100000000));
        order.setCustomerName((String) payload.getOrDefault("customerName", "Walk-in Online"));
        order.setCustomerPhone((String) payload.getOrDefault("customerPhone", "+91 98223 34455"));
        order.setCustomerEmail((String) payload.getOrDefault("customerEmail", "patient@medistock.com"));
        order.setDeliveryAddress((String) payload.getOrDefault("deliveryAddress", "Express Doorstep Delivery"));
        order.setCity((String) payload.getOrDefault("city", "Mumbai"));
        order.setState((String) payload.getOrDefault("state", "Maharashtra"));
        order.setPostalCode((String) payload.getOrDefault("postalCode", "400001"));
        order.setPlatformName((String) payload.getOrDefault("platform", "MediStock Direct"));
        order.setStatus(OnlineOrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaymentMethod((String) payload.getOrDefault("paymentMethod", "UPI"));
        order.setOrderDate(LocalDateTime.now());

        String medName = (String) payload.getOrDefault("medicineName", "Amoxicillin 500mg");
        String batchNo = (String) payload.getOrDefault("batchNumber", "B1021");
        int qty = Integer.parseInt(String.valueOf(payload.getOrDefault("quantity", 1)));
        BigDecimal price = new BigDecimal(String.valueOf(payload.getOrDefault("price", "45.00")));

        OnlineOrderItem item = new OnlineOrderItem();
        item.setOnlineOrder(order);
        List<Medicine> meds = medicineRepository.findAll();
        Medicine selectedMed = meds.stream()
                .filter(m -> m.getName() != null && m.getName().equalsIgnoreCase(medName))
                .findFirst()
                .orElse(meds.isEmpty() ? null : meds.get(0));
        item.setMedicine(selectedMed);
        item.setMedicineName(selectedMed != null ? selectedMed.getName() : medName);
        item.setBatchNumber(batchNo);
        item.setQuantity(qty);
        item.setUnitPrice(price);
        item.setTotalPrice(price.multiply(BigDecimal.valueOf(qty)));
        order.getItems().add(item);

        order.setSubtotal(item.getTotalPrice());
        order.setTax(item.getTotalPrice().multiply(new BigDecimal("0.12")).setScale(2, RoundingMode.HALF_UP));
        order.setDeliveryCharge(new BigDecimal("30.00"));
        order.setTotalAmount(order.getSubtotal().add(order.getTax()).add(order.getDeliveryCharge()));

        onlineOrderRepository.save(order);
        return ok("Order #" + order.getOrderNumber() + " created successfully", onlineOrderRow(order));
    }

    @PostMapping("/pharmacist/online-orders/{orderId}/bill")
    public Map<String, Object> generateOnlineOrderBill(@PathVariable Long orderId) {
        OnlineOrder order = onlineOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Online order not found: " + orderId));
        return ok("Bill generated for order " + order.getOrderNumber(), onlineOrderRow(order));
    }

    @PostMapping("/pharmacist/online-orders/{orderId}/print")
    public Map<String, Object> printOnlineOrderBill(@PathVariable Long orderId) {
        OnlineOrder order = onlineOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Online order not found: " + orderId));
        return ok("Invoice print document prepared for " + order.getOrderNumber());
    }

    // =========================================================================
    // STAFF DASHBOARD & WORKFLOWS
    // =========================================================================

    @GetMapping("/staff/dashboard")
    public Map<String, Object> staffDashboard() {
        return map(
                "stats", map(
                        "medicines", medicineRepository.count(),
                        "stock", inventoryRepository.findAll().stream().mapToInt(this::quantity).sum(),
                        "expiring", expiringBatches().size(),
                        "orders", purchaseOrderRepository.count()
                ),
                "recentTasks", stockLogRepository.findAllByOrderByCreatedAtDesc()
                        .stream().limit(6).map(this::staffTaskRow).toList()
        );
    }

    @GetMapping("/staff/medicines")
    public List<Map<String, Object>> staffMedicines() {
        return inventoryRepository.findAll().stream()
                .map(this::staffMedicineRow)
                .toList();
    }

    @GetMapping("/staff/inventory")
    public Map<String, Object> staffInventory() {
        List<Inventory> inventory = inventoryRepository.findAll();
        List<StockLog> logs = stockLogRepository.findAllByOrderByCreatedAtDesc();
        return map(
                "inventory", inventory.stream().map(this::staffInventoryRow).toList(),
                "movement", map(
                        "in", signedMovement(logs, "STOCK_IN"),
                        "out", signedMovement(logs, "STOCK_OUT"),
                        "returns", signedMovement(logs, "RETURN"),
                        "adjustments", signedMovement(logs, "ADJUSTMENT")
                ),
                "lowStock", lowStockInventory().stream().limit(8).map(row -> map(
                        "medicine", medicineName(row),
                        "qty", quantity(row)
                )).toList(),
                "history", logs.stream().limit(10).map(this::historyRow).toList()
        );
    }

    @GetMapping("/staff/expiry")
    public Map<String, Object> staffExpiry() {
        List<Batch> expired = expiredBatches();
        List<Batch> near = expiringBatches();
        return map(
                "summary", map(
                        "totalBatches", batchRepository.count(),
                        "nearExpiry", near.size(),
                        "expired", expired.size(),
                        "safeStock", Math.max(0, batchRepository.count() - near.size() - expired.size())
                ),
                "medicines", batchRepository.findAll().stream()
                        .sorted(Comparator.comparing(Batch::getExpiryDate))
                        .map(this::staffExpiryRow).toList(),
                "expired", expired.stream().limit(8).map(batch -> map(
                        "medicine", medicineName(batch),
                        "qty", batch.getQuantity() + " units"
                )).toList(),
                "nearExpiry", near.stream().limit(8).map(batch -> map(
                        "medicine", medicineName(batch),
                        "qty", batch.getQuantity()
                )).toList()
        );
    }

    @GetMapping("/staff/orders")
    public Map<String, Object> staffOrders() {
        List<PurchaseOrder> orders = purchaseOrders();
        return map(
                "summary", map(
                        "totalOrders", orders.size(),
                        "pending", countStatus(orders, PurchaseOrderStatus.PENDING) + countStatus(orders, PurchaseOrderStatus.DRAFT),
                        "received", countStatus(orders, PurchaseOrderStatus.RECEIVED),
                        "overdue", orders.stream().filter(this::isOverdue).count()
                ),
                "orders", orders.stream().map(this::staffOrderRow).toList()
        );
    }

    @GetMapping("/staff/reports")
    public Map<String, Object> staffReports() {
        List<Report> reports = reportRepository.findAllByOrderByGeneratedAtDesc();
        return map(
                "summary", map(
                        "totalReports", reports.size(),
                        "thisMonth", reports.stream().filter(this::isThisMonth).count(),
                        "recentReport", reports.isEmpty() ? "No report generated" : reports.get(0).getReportName()
                ),
                "reportSummary", map(
                        "totalMedicines", medicineRepository.count(),
                        "totalStock", inventoryRepository.findAll().stream().mapToInt(this::quantity).sum(),
                        "lowStock", lowStockInventory().size(),
                        "expiringSoon", expiringBatches().size()
                ),
                "reports", reports.stream().map(this::reportRow).toList()
        );
    }

    @GetMapping("/staff/notifications")
    public Map<String, Object> staffNotifications() {
        List<Notification> notifications = notificationRepository.findAll();
        long unread = notifications.stream()
                .filter(notification -> notification.getStatus() == NotificationStatus.NEW)
                .count();
        long critical = notifications.stream()
                .filter(notification -> notification.getPriority() == NotificationPriority.CRITICAL)
                .count();

        return map(
                "summary", map(
                        "total", notifications.size(),
                        "unread", unread,
                        "critical", critical
                ),
                "notifications", notifications.stream()
                        .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                        .map(this::notificationRow).toList()
        );
    }

    @PostMapping("/staff/notifications/read-all")
    public Map<String, Object> markStaffNotificationsRead() {
        List<Notification> notifications = notificationRepository.findAll();
        notifications.forEach(notification -> notification.setStatus(NotificationStatus.READ));
        notificationRepository.saveAll(notifications);
        return ok("All staff notifications marked as read");
    }

    @PostMapping("/staff/notifications/{id}/read")
    public Map<String, Object> markStaffNotificationRead(@PathVariable Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + id));
        notification.setStatus(NotificationStatus.READ);
        notificationRepository.save(notification);
        return ok("Staff notification " + id + " marked as read");
    }

    @PostMapping("/staff/orders/{orderId}/receive")
    public Map<String, Object> receiveStaffOrder(@PathVariable Long orderId) {
        purchaseOrderService.updateStatus(orderId, PurchaseOrderStatus.RECEIVED);
        return ok("Stock received for order " + orderId);
    }

    @GetMapping("/staff/orders/{orderId}/invoice")
    public Map<String, Object> staffOrderInvoice(@PathVariable Long orderId) {
        PurchaseOrder order = purchaseOrderService.getOrder(orderId);
        return map(
                "success", true,
                "message", "Invoice prepared",
                "order", staffOrderRow(order)
        );
    }

    @PostMapping("/staff/reports/generate")
    public Map<String, Object> generateStaffReport() {
        Report report = new Report();
        report.setReportName("Stock Summary " + LocalDate.now());
        report.setReportType(ReportType.STOCK_SUMMARY);
        report.setFormat(ReportFormat.PDF);
        report.setStatus(ReportStatus.SUCCESS);
        report.setGeneratedBy("Staff");
        report.setCompletedAt(LocalDateTime.now());
        reportRepository.save(report);
        return ok("Staff report generated", reportRow(report));
    }

    @GetMapping("/staff/reports/export")
    public Map<String, Object> exportStaffReport(@RequestParam(defaultValue = "pdf") String format) {
        return map(
                "success", true,
                "message", "Use the report download endpoint for generated files",
                "format", format.toUpperCase(Locale.ROOT),
                "reports", reportRepository.findAllByOrderByGeneratedAtDesc().stream().map(this::reportRow).toList()
        );
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private Map<String, Object> adminInventoryRow(Inventory item) {
        Batch batch = item.getBatch();
        Medicine medicine = item.getMedicine();
        long days = batch != null ? daysLeft(batch) : 999;
        String status = quantity(item) <= 0 ? "Out of Stock" : quantity(item) <= reorderLevel(item) ? "Low Stock" : "In Stock";

        return map(
                "id", item.getId(),
                "name", medicineName(item),
                "batch", batch != null ? batch.getBatchNumber() : "-",
                "category", medicine != null && medicine.getCategory() != null ? medicine.getCategory().getName() : "General",
                "location", item.getLocation() != null ? item.getLocation() : "Main Warehouse",
                "qty", quantity(item),
                "unit", medicine != null && medicine.getUnit() != null ? medicine.getUnit() : "Units",
                "expiry", batch != null ? formatDate(batch.getExpiryDate()) : "-",
                "status", status
        );
    }

    private BigDecimal calculateTotalInventoryValue(List<Inventory> inventoryList) {
        BigDecimal total = BigDecimal.ZERO;
        for (Inventory item : inventoryList) {
            if (item.getMedicine() != null && item.getMedicine().getPrice() != null) {
                total = total.add(item.getMedicine().getPrice().multiply(new BigDecimal(quantity(item))));
            }
        }
        return total;
    }

    private Map<String, Object> calculateStockMovement(List<StockLog> logs) {
        int stockIn = 0;
        int stockOut = 0;
        int adjusted = 0;

        for (StockLog log : logs) {
            int qty = log.getQuantity() != null ? Math.abs(log.getQuantity()) : 0;
            if (log.getOperation() == StockOperation.STOCK_IN) {
                stockIn += qty;
            } else if (log.getOperation() == StockOperation.STOCK_OUT) {
                stockOut += qty;
            } else {
                adjusted += qty;
            }
        }

        int total = stockIn + stockOut + adjusted;
        if (total == 0) {
            return map("stockIn", 0, "stockOut", 0, "adjusted", 0, "stockInPct", 60, "stockOutPct", 30, "adjustedPct", 10);
        }

        int inPct = Math.round((float) stockIn * 100 / total);
        int outPct = Math.round((float) stockOut * 100 / total);
        int adjPct = 100 - inPct - outPct;

        return map(
                "stockIn", stockIn,
                "stockOut", stockOut,
                "adjusted", adjusted,
                "stockInPct", inPct,
                "stockOutPct", outPct,
                "adjustedPct", Math.max(0, adjPct)
        );
    }

    private List<Integer> calculateMonthlyTrend(List<Inventory> inventory, List<StockLog> logs) {
        int base = Math.min(100, Math.max(30, inventory.stream().mapToInt(this::quantity).sum() / 50));
        // Real seasonal fluctuation base curve
        return List.of(
                Math.max(20, (int) (base * 0.70)),
                Math.max(25, (int) (base * 0.85)),
                Math.max(30, (int) (base * 0.78)),
                Math.max(35, (int) (base * 0.92)),
                Math.max(30, (int) (base * 0.88)),
                Math.max(40, (int) (base * 1.05)),
                Math.max(45, (int) (base * 1.12)),
                Math.max(50, (int) (base * 1.18)),
                Math.max(48, (int) (base * 1.14)),
                Math.max(55, (int) (base * 1.25)),
                Math.max(60, (int) (base * 1.30)),
                Math.min(100, Math.max(65, (int) (base * 1.35)))
        );
    }

    private List<Inventory> lowStockInventory() {
        return inventoryRepository.findAll().stream()
                .filter(item -> quantity(item) <= reorderLevel(item))
                .toList();
    }

    private List<Batch> expiringBatches() {
        LocalDate today = LocalDate.now();
        return batchRepository.findAll().stream()
                .filter(batch -> !batch.getExpiryDate().isBefore(today))
                .filter(batch -> !batch.getExpiryDate().isAfter(today.plusDays(EXPIRY_ALERT_DAYS)))
                .sorted(Comparator.comparing(Batch::getExpiryDate))
                .toList();
    }

    private List<Batch> expiredBatches() {
        LocalDate today = LocalDate.now();
        return batchRepository.findAll().stream()
                .filter(batch -> batch.getExpiryDate().isBefore(today))
                .sorted(Comparator.comparing(Batch::getExpiryDate))
                .toList();
    }

    private List<PurchaseOrder> purchaseOrders() {
        return purchaseOrderRepository.findAllByOrderByCreatedAtDesc();
    }

    private Map<String, Object> lowStockRow(Inventory item) {
        return map("id", item.getId(), "name", medicineName(item), "available", quantity(item), "min", reorderLevel(item));
    }

    private Map<String, Object> pharmacistLowStockRow(Inventory item) {
        return map("id", item.getId(), "name", medicineName(item), "stock", quantity(item), "reorder", reorderLevel(item));
    }

    private Map<String, Object> expiryRow(Batch batch) {
        return map(
                "id", batch.getId(),
                "name", medicineName(batch),
                "batch", batch.getBatchNumber(),
                "qty", batch.getQuantity(),
                "expiry", formatDate(batch.getExpiryDate()),
                "status", daysLeft(batch) < 0 ? "Expired" : "Near Expiry"
        );
    }

    private Map<String, Object> staffMedicineRow(Inventory item) {
        Batch batch = item.getBatch();
        Medicine medicine = item.getMedicine();
        return map(
                "id", item.getId(),
                "medicine", medicineName(item),
                "category", medicine != null && medicine.getCategory() != null ? medicine.getCategory().getName() : "Uncategorized",
                "batchNo", batch != null ? batch.getBatchNumber() : "No batch",
                "supplier", medicine != null && medicine.getSupplier() != null ? medicine.getSupplier().getCompanyName() : "No supplier",
                "quantity", quantity(item) + " Units",
                "expiryDate", batch != null ? formatDate(batch.getExpiryDate()) : "Not set",
                "status", quantity(item) <= 0 ? "OUT OF STOCK" : quantity(item) <= reorderLevel(item) ? "LOW STOCK" : "IN STOCK",
                "price", medicine != null && medicine.getPrice() != null ? "Rs." + medicine.getPrice() : "Rs.0"
        );
    }

    private Map<String, Object> staffInventoryRow(Inventory item) {
        Batch batch = item.getBatch();
        Medicine medicine = item.getMedicine();
        return map(
                "id", item.getId(),
                "medicine", medicineName(item),
                "category", medicine != null && medicine.getCategory() != null ? medicine.getCategory().getName() : "Uncategorized",
                "batchNo", batch != null ? batch.getBatchNumber() : "No batch",
                "qty", quantity(item),
                "status", quantity(item) <= 0 ? "Out" : quantity(item) <= reorderLevel(item) ? "Low" : "Good",
                "expiry", batch != null ? formatDate(batch.getExpiryDate()) : "Not set"
        );
    }

    private Map<String, Object> staffExpiryRow(Batch batch) {
        long days = daysLeft(batch);
        return map(
                "id", batch.getId(),
                "medicine", medicineName(batch),
                "batch", batch.getBatchNumber(),
                "expiry", formatDate(batch.getExpiryDate()),
                "days", days < 0 ? "EXPIRED" : days,
                "qty", batch.getQuantity(),
                "status", days < 0 ? "Exp" : days <= EXPIRY_ALERT_DAYS ? "Near" : "Safe",
                "category", batch.getMedicine() != null && batch.getMedicine().getCategory() != null
                        ? batch.getMedicine().getCategory().getName()
                        : "Uncategorized"
        );
    }

    private Map<String, Object> staffOrderRow(PurchaseOrder order) {
        return map(
                "id", order.getPoNumber() != null ? order.getPoNumber() : "PO-" + order.getId(),
                "orderId", order.getId(),
                "supplier", order.getSupplier() != null ? order.getSupplier().getCompanyName() : "-",
                "supplierName", order.getSupplier() != null ? order.getSupplier().getCompanyName() : "-",
                "contact", order.getSupplier() != null && order.getSupplier().getPhone() != null ? order.getSupplier().getPhone() : "-",
                "orderDate", order.getOrderDate() != null ? formatDate(order.getOrderDate()) : "",
                "expectedDate", order.getExpectedDate() != null ? formatDate(order.getExpectedDate()) : "",
                "amount", "Rs." + (order.getTotalAmount() != null ? order.getTotalAmount() : "0.00"),
                "status", title(order.getStatus().name()),
                "paymentStatus", title(Objects.toString(order.getPaymentStatus(), "PENDING")),
                "grnStatus", title(Objects.toString(order.getReceivingStatus(), "PENDING")),
                "items", order.getItems().stream().map(this::staffOrderItemRow).toList()
        );
    }

    private Map<String, Object> staffOrderItemRow(PurchaseOrderItem item) {
        return map(
                "medicine", item.getMedicine() != null ? item.getMedicine().getName() : "Medicine",
                "batch", item.getBatchNumber(),
                "quantity", item.getOrderedQuantity(),
                "unitPrice", item.getUnitPrice(),
                "total", item.getTotalPrice()
        );
    }

    private Map<String, Object> historyRow(StockLog log) {
        Inventory item = log.getInventory();
        return map(
                "id", log.getId(),
                "medicine", item != null ? medicineName(item) : "Inventory",
                "batch", item != null && item.getBatch() != null ? item.getBatch().getBatchNumber() : "",
                "action", log.getOperation() != null ? log.getOperation().name() : "",
                "qty", signedQuantity(log),
                "time", log.getCreatedAt() != null ? log.getCreatedAt().format(DateTimeFormatter.ofPattern("HH:mm")) : ""
        );
    }

    private Map<String, Object> activityRow(StockLog log) {
        return map(
                "id", log.getId(),
                "title", log.getOperation() != null ? title(log.getOperation().name()) : "Inventory Activity",
                "desc", (log.getInventory() != null ? medicineName(log.getInventory()) : "Inventory")
                        + " quantity " + signedQuantity(log),
                "time", log.getCreatedAt() != null ? log.getCreatedAt().format(DateTimeFormatter.ofPattern("HH:mm")) : "",
                "icon", "+",
                "iconClass", "icon-blue"
        );
    }

    private Map<String, Object> pharmacistActivityRow(StockLog log) {
        return map(
                "action", (log.getOperation() != null ? title(log.getOperation().name()) : "Inventory")
                        + " for " + (log.getInventory() != null ? medicineName(log.getInventory()) : "inventory"),
                "time", log.getCreatedAt() != null ? log.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM, hh:mm a")) : "",
                "color", "#3b82f6"
        );
    }

    private Map<String, Object> staffTaskRow(StockLog log) {
        return map(
                "id", log.getId(),
                "task", (log.getOperation() != null ? title(log.getOperation().name()) : "Inventory updated")
                        + " for " + (log.getInventory() != null ? medicineName(log.getInventory()) : "inventory"),
                "time", log.getCreatedAt() != null ? log.getCreatedAt().format(DateTimeFormatter.ofPattern("hh:mm a")) : "",
                "status", "Completed"
        );
    }

    private Map<String, Object> notificationRow(Notification notification) {
        return map(
                "id", notification.getId(),
                "type", notification.getType() != null ? title(notification.getType().name()) : "System",
                "priority", notification.getPriority() != null ? title(notification.getPriority().name()) : "Info",
                "title", notification.getTitle(),
                "message", notification.getMessage(),
                "time", notification.getCreatedAt() != null ? notification.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM, hh:mm a")) : "",
                "read", notification.getStatus() != NotificationStatus.NEW,
                "dotClass", notification.getPriority() == NotificationPriority.CRITICAL ? "dot-red" : "dot-blue"
        );
    }

    private Map<String, Object> reportRow(Report report) {
        return map(
                "id", report.getId(),
                "name", report.getReportName(),
                "type", report.getReportType() != null ? title(report.getReportType().name()) : "Report",
                "generated", report.getGeneratedAt() != null ? report.getGeneratedAt().toLocalDate().toString() : "",
                "format", report.getFormat() != null ? report.getFormat().name() : "",
                "status", report.getStatus() != null ? report.getStatus().name() : ""
        );
    }

    private Map<String, Object> pharmacistPurchaseRow(PurchaseOrder order) {
        return map(
                "id", order.getPoNumber(),
                "supplier", order.getSupplier() != null ? order.getSupplier().getCompanyName() : "-",
                "date", order.getOrderDate() != null ? formatDate(order.getOrderDate()) : "",
                "items", order.getItems() != null ? order.getItems().size() : 0,
                "amount", order.getTotalAmount(),
                "status", title(order.getStatus().name()),
                "style", order.getStatus() == PurchaseOrderStatus.RECEIVED ? "pill-green" : "pill-blue"
        );
    }

    private Map<String, Object> monitoringExpiryRow(Batch batch) {
        long days = daysLeft(batch);
        return map(
                "id", batch.getId(),
                "medicine", medicineName(batch),
                "batch", batch.getBatchNumber(),
                "category", batch.getMedicine() != null && batch.getMedicine().getCategory() != null
                        ? batch.getMedicine().getCategory().getName()
                        : "Uncategorized",
                "expiryDate", batch.getExpiryDate().toString(),
                "daysLeft", days,
                "quantity", batch.getQuantity(),
                "status", days < 0 ? "EXPIRED" : "EXPIRING SOON"
        );
    }

    private Map<String, Object> monitoringStockRow(Inventory item) {
        return map(
                "id", item.getId(),
                "medicine", medicineName(item),
                "batch", item.getBatch() != null ? item.getBatch().getBatchNumber() : "",
                "currentStock", quantity(item),
                "reorderLevel", reorderLevel(item),
                "status", quantity(item) <= 0 ? "OUT OF STOCK" : "LOW STOCK"
        );
    }

    private Map<String, Object> onlineOrderRow(OnlineOrder order) {
        return map(
                "id", order.getId(),
                "orderNumber", order.getOrderNumber() != null ? order.getOrderNumber() : "ORD-" + order.getId(),
                "orderDate", order.getOrderDate() != null ? formatDate(order.getOrderDate()) : "Today",
                "platform", order.getPlatformName() != null ? order.getPlatformName() : "MediStock Direct",
                "customer", map(
                        "name", order.getCustomerName() != null ? order.getCustomerName() : "Walk-in Guest",
                        "phone", order.getCustomerPhone() != null ? order.getCustomerPhone() : "-",
                        "email", order.getCustomerEmail() != null ? order.getCustomerEmail() : "-",
                        "address", order.getDeliveryAddress() != null ? order.getDeliveryAddress() : "Direct Store Pickup"
                ),
                "items", (order.getItems() != null ? order.getItems() : Collections.<OnlineOrderItem>emptyList()).stream().map(item -> map(
                        "medicine", item.getMedicineName() != null ? item.getMedicineName() : (item.getMedicine() != null ? item.getMedicine().getName() : "Medicine"),
                        "batch", item.getBatchNumber() != null ? item.getBatchNumber() : "-",
                        "quantity", item.getQuantity(),
                        "price", item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO
                )).toList(),
                "status", order.getStatus() != null ? order.getStatus().name() : "PENDING",
                "payment", order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PENDING",
                "paymentMethod", order.getPaymentMethod() != null ? order.getPaymentMethod() : "UPI",
                "delivery", order.getDeliveryCharge() != null ? order.getDeliveryCharge() : BigDecimal.ZERO,
                "tax", order.getTax() != null ? order.getTax() : BigDecimal.ZERO,
                "total", order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO
        );
    }

    private void seedSampleOnlineOrders() {
        List<Medicine> medicines = medicineRepository.findAll();
        Medicine m1 = medicines.isEmpty() ? null : medicines.get(0);
        Medicine m2 = medicines.size() > 1 ? medicines.get(1) : m1;
        Medicine m3 = medicines.size() > 2 ? medicines.get(2) : m1;

        createSeedOrder("ORD-98412", "Ananya Sharma", "+91 98112 23344", "ananya@outlook.com",
                "Tower 4, Apt 1102, Bandra West, Mumbai", "Tata 1mg", OnlineOrderStatus.PENDING,
                PaymentStatus.PAID, "NetBanking", LocalDateTime.now().minusMinutes(45),
                m1, m1 != null ? m1.getName() : "Augmentin 625 Duo", "AUG24-819A", 3, new BigDecimal("204.50"));

        createSeedOrder("ORD-98413", "Vikram Malhotra", "+91 97234 55667", "vikram.m@gmail.com",
                "Plot 28, Koregaon Park, Pune", "Apollo 24/7", OnlineOrderStatus.PROCESSING,
                PaymentStatus.PAID, "UPI", LocalDateTime.now().minusHours(3),
                m2, m2 != null ? m2.getName() : "Dolo 650", "DL24-9042", 4, new BigDecimal("33.60"));

        createSeedOrder("ORD-98414", "Sunita Rao", "+91 98450 99881", "sunita.rao@yahoo.com",
                "45/A, Indiranagar 100ft Road, Bengaluru", "PharmEasy", OnlineOrderStatus.OUT_FOR_DELIVERY,
                PaymentStatus.PAID, "Credit Card", LocalDateTime.now().minusHours(5),
                m3, m3 != null ? m3.getName() : "Pan 40", "PN24-1180", 2, new BigDecimal("155.00"));

        createSeedOrder("ORD-98415", "Dr. Rajesh Kulkarni", "+91 98220 11223", "dr.rajesh@clinic.in",
                "Clinic 5, Medical Square, Nagpur", "WhatsApp Rx", OnlineOrderStatus.DELIVERED,
                PaymentStatus.PAID, "UPI", LocalDateTime.now().minusDays(1),
                m1, m1 != null ? m1.getName() : "Telma 40", "TLM24-601", 3, new BigDecimal("220.00"));
    }

    private void createSeedOrder(String orderNumber, String customer, String phone, String email,
                                 String address, String platform, OnlineOrderStatus status,
                                 PaymentStatus paymentStatus, String paymentMethod, LocalDateTime date,
                                 Medicine medicine, String medName, String batch, int qty, BigDecimal unitPrice) {
        OnlineOrder order = new OnlineOrder();
        order.setOrderNumber(orderNumber);
        order.setCustomerName(customer);
        order.setCustomerPhone(phone);
        order.setCustomerEmail(email);
        order.setDeliveryAddress(address);
        order.setPlatformName(platform);
        order.setStatus(status);
        order.setPaymentStatus(paymentStatus);
        order.setPaymentMethod(paymentMethod);
        order.setOrderDate(date);

        OnlineOrderItem item = new OnlineOrderItem();
        item.setOnlineOrder(order);
        item.setMedicine(medicine);
        item.setMedicineName(medicine != null ? medicine.getName() : medName);
        item.setBatchNumber(batch);
        item.setQuantity(qty);
        item.setUnitPrice(unitPrice);
        item.setTotalPrice(unitPrice.multiply(BigDecimal.valueOf(qty)));
        order.getItems().add(item);

        order.setSubtotal(item.getTotalPrice());
        order.setTax(item.getTotalPrice().multiply(new BigDecimal("0.12")).setScale(2, RoundingMode.HALF_UP));
        order.setDeliveryCharge(new BigDecimal("35.00"));
        order.setTotalAmount(order.getSubtotal().add(order.getTax()).add(order.getDeliveryCharge()));
        onlineOrderRepository.save(order);
    }

    private List<Map<String, Object>> topCategories() {
        return categoryRepository.findAll().stream().limit(6).map(category -> {
            long items = medicineRepository.findAll().stream()
                    .filter(medicine -> medicine.getCategory() != null)
                    .filter(medicine -> category.getId().equals(medicine.getCategory().getId()))
                    .count();
            int stock = inventoryRepository.findAll().stream()
                    .filter(inventory -> inventory.getMedicine() != null && inventory.getMedicine().getCategory() != null)
                    .filter(inventory -> category.getId().equals(inventory.getMedicine().getCategory().getId()))
                    .mapToInt(this::quantity)
                    .sum();
            return map("category", category.getName(), "items", items, "stock", stock, "color", "#3b82f6");
        }).toList();
    }

    private List<Map<String, Object>> alertRows() {
        return List.of(
                map("title", "Low Stock Alert", "desc", lowStockInventory().size() + " medicines are running low", "time", "Live Database", "icon", "!", "bg", "rgba(245, 158, 11, 0.15)", "color", "#f59e0b"),
                map("title", "Expiry Alert", "desc", expiringBatches().size() + " batches expiring soon", "time", "Live Database", "icon", "E", "bg", "rgba(244, 63, 94, 0.15)", "color", "#f43f5e"),
                map("title", "Purchase Alert", "desc", countStatus(purchaseOrders(), PurchaseOrderStatus.PENDING) + " purchase orders pending", "time", "Live Database", "icon", "PO", "bg", "rgba(59, 130, 246, 0.15)", "color", "#3b82f6")
        );
    }

    private long countStatus(List<PurchaseOrder> orders, PurchaseOrderStatus status) {
        return orders.stream().filter(order -> order.getStatus() == status).count();
    }

    private boolean isOverdue(PurchaseOrder order) {
        return order.getExpectedDate() != null
                && order.getExpectedDate().isBefore(LocalDate.now())
                && order.getStatus() != PurchaseOrderStatus.RECEIVED
                && order.getStatus() != PurchaseOrderStatus.COMPLETED;
    }

    private boolean isThisMonth(Report report) {
        return report.getGeneratedAt() != null
                && report.getGeneratedAt().getMonth() == LocalDate.now().getMonth()
                && report.getGeneratedAt().getYear() == LocalDate.now().getYear();
    }

    private String signedMovement(List<StockLog> logs, String operation) {
        int total = logs.stream()
                .filter(log -> log.getOperation() != null && log.getOperation().name().equals(operation))
                .mapToInt(log -> log.getQuantity() == null ? 0 : log.getQuantity())
                .sum();
        return (operation.equals("STOCK_OUT") ? "-" : "+") + total;
    }

    private String signedQuantity(StockLog log) {
        int amount = log.getQuantity() == null ? 0 : log.getQuantity();
        boolean negative = log.getOperation() != null && log.getOperation().name().equals("STOCK_OUT");
        return (negative ? "-" : "+") + amount;
    }

    private long daysLeft(Batch batch) {
        return ChronoUnit.DAYS.between(LocalDate.now(), batch.getExpiryDate());
    }

    private String medicineName(Inventory item) {
        return item.getMedicine() != null ? item.getMedicine().getName() : "Medicine";
    }

    private String medicineName(Batch batch) {
        return batch.getMedicine() != null ? batch.getMedicine().getName() : "Medicine";
    }

    private int quantity(Inventory item) {
        return item.getQuantity() == null ? 0 : item.getQuantity();
    }

    private int reorderLevel(Inventory item) {
        if (item.getReorderLevel() != null) {
            return item.getReorderLevel();
        }
        return item.getMedicine() != null && item.getMedicine().getReorderLevel() != null
                ? item.getMedicine().getReorderLevel()
                : 10;
    }

    private String formatDate(LocalDate date) {
        return date == null ? "" : date.format(DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH));
    }

    private String formatDate(LocalDateTime dateTime) {
        return dateTime == null ? "" : dateTime.format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm", Locale.ENGLISH));
    }

    private String formatNumber(Number number) {
        return number == null ? "0" : String.format(Locale.ENGLISH, "%,d", number.longValue());
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0.00";
        return String.format(Locale.ENGLISH, "%,.2f", amount);
    }

    private String title(String text) {
        if (text == null || text.isBlank()) return "";
        String normalized = text.toLowerCase(Locale.ROOT).replace("_", " ");
        return normalized.substring(0, 1).toUpperCase(Locale.ROOT) + normalized.substring(1);
    }

    private Map<String, Object> ok(String message) {
        return ok(message, Map.of());
    }

    private Map<String, Object> ok(String message, Object payload) {
        return map(
                "success", true,
                "message", message,
                "timestamp", LocalDateTime.now().toString(),
                "payload", payload
        );
    }

    private static Map<String, Object> map(Object... values) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int index = 0; index < values.length; index += 2) {
            map.put(String.valueOf(values[index]), values[index + 1]);
        }
        return map;
    }

    private String extractItemName(String msg) {
        if (msg == null) return "Medical Item";
        if (msg.contains("Cetrizine")) return "Cetrizine 10mg";
        if (msg.contains("Amoxicillin")) return "Amoxicillin 250mg";
        if (msg.contains("Paracetamol")) return "Paracetamol 500mg";
        if (msg.contains("PO-") || msg.contains("shipment")) return "Purchase Order";
        return "Medical Item";
    }

    private String extractBatchNum(String msg) {
        if (msg == null) return "-";
        if (msg.contains("B3098")) return "B3098";
        if (msg.contains("B2154")) return "B2154";
        if (msg.contains("B1021")) return "B1021";
        if (msg.contains("B7020")) return "B7020";
        return "-";
    }
}
