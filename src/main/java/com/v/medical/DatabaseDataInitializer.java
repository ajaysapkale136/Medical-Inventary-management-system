package com.v.medical;

import com.v.medical.Service.PasswordService;
import com.v.medical.entity.*;
import com.v.medical.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Component
@Order(1)
public class DatabaseDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final MedicineRepository medicineRepository;
    private final BatchRepository batchRepository;
    private final InventoryRepository inventoryRepository;
    private final StockLogRepository stockLogRepository;
    private final LowStockAlertRepository lowStockAlertRepository;
    private final NotificationRepository notificationRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final OnlineOrderRepository onlineOrderRepository;
    private final ReportRepository reportRepository;
    private final AuditLogRepository auditLogRepository;
    private final StockTransferRepository stockTransferRepository;

    public DatabaseDataInitializer(
            UserRepository userRepository,
            PasswordService passwordService,
            CategoryRepository categoryRepository,
            SupplierRepository supplierRepository,
            MedicineRepository medicineRepository,
            BatchRepository batchRepository,
            InventoryRepository inventoryRepository,
            StockLogRepository stockLogRepository,
            LowStockAlertRepository lowStockAlertRepository,
            NotificationRepository notificationRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            OnlineOrderRepository onlineOrderRepository,
            ReportRepository reportRepository,
            AuditLogRepository auditLogRepository,
            StockTransferRepository stockTransferRepository) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
        this.inventoryRepository = inventoryRepository;
        this.stockLogRepository = stockLogRepository;
        this.lowStockAlertRepository = lowStockAlertRepository;
        this.notificationRepository = notificationRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.onlineOrderRepository = onlineOrderRepository;
        this.reportRepository = reportRepository;
        this.auditLogRepository = auditLogRepository;
        this.stockTransferRepository = stockTransferRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedUsers();

        boolean hasOldDummyData = supplierRepository.findAll().stream()
                .anyMatch(s -> s.getCompanyName() != null && s.getCompanyName().contains("ABC Pharma"))
                || medicineRepository.findAll().stream()
                .anyMatch(m -> m.getName() != null && m.getName().equalsIgnoreCase("Paracetamol 500mg")
                        && "Paracetamol".equalsIgnoreCase(m.getGenericName()));

        if (medicineRepository.count() == 0 || hasOldDummyData) {
            resetAndSeedRealClinicalData();
        }
    }

    @Transactional
    public synchronized void resetAndSeedRealClinicalData() {
        // 1. Purge all records in strict reverse foreign key dependency order
        try { auditLogRepository.deleteAll(); auditLogRepository.flush(); } catch (Exception ignored) {}
        try { stockTransferRepository.deleteAll(); stockTransferRepository.flush(); } catch (Exception ignored) {}
        stockLogRepository.deleteAll();
        stockLogRepository.flush();
        onlineOrderRepository.deleteAll();
        onlineOrderRepository.flush();
        purchaseOrderRepository.deleteAll();
        purchaseOrderRepository.flush();
        lowStockAlertRepository.deleteAll();
        lowStockAlertRepository.flush();
        notificationRepository.deleteAll();
        notificationRepository.flush();
        inventoryRepository.deleteAll();
        inventoryRepository.flush();
        batchRepository.deleteAll();
        batchRepository.flush();
        medicineRepository.deleteAll();
        medicineRepository.flush();
        supplierRepository.deleteAll();
        supplierRepository.flush();
        categoryRepository.deleteAll();
        categoryRepository.flush();
        reportRepository.deleteAll();
        reportRepository.flush();

        // 2. Ensure base users are intact
        seedUsers();

        // 3. Seed real therapeutic categories
        seedRealCategories();

        // 4. Seed real authentic pharmaceutical corporations
        seedRealSuppliers();

        // 5. Seed real clinical medicines, batches, inventory, and stock logs
        seedRealCatalogAndInventory();

        // 6. Seed real purchase orders
        seedRealPurchaseOrders();

        // 7. Seed real multi-channel online orders
        seedRealOnlineOrders();

        // 8. Seed real clinical notifications and safety alerts
        seedRealNotificationsAndAlerts();

        // 9. Seed real compliance reports
        seedRealReports();
    }

    private void seedUsers() {
        createUserIfNotExists("Dr. Ajay Sharma", "admin@medistock.com", "Admin@1234", Role.ADMIN,
                "+91 98765 43210", "Clinical Operations & Compliance", "Central Command - Mumbai");
        createUserIfNotExists("Priya Mehta, R.Ph.", "pharmacist@medistock.com", "Pharma@1234", Role.PHARMACIST,
                "+91 97654 32109", "Dispensing & Quality Assurance", "Central Hospital Dispensary");
        createUserIfNotExists("Rohit Kumar", "staff@medistock.com", "Staff@1234", Role.STAFF,
                "+91 98712 34567", "Warehouse Logistics & GRN", "Central Distribution Facility");
        createUserIfNotExists("Sneha Nair, R.Ph.", "sneha.nair@medistock.com", "Staff@1234", Role.PHARMACIST,
                "+91 98234 56781", "Inward Stock Verification", "North Ward Satellite Pharmacy");
        createUserIfNotExists("Amit Patel", "amit.patel@medistock.com", "Staff@1234", Role.STAFF,
                "+91 97123 45676", "Shift Receiving & Barcode Dispatch", "West Logistics Depot");
    }

    private void createUserIfNotExists(String name, String email, String rawPassword, Role role,
                                      String phone, String dept, String loc) {
        String cleanEmail = email.toLowerCase().trim();
        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            return;
        }
        User user = new User();
        user.setName(name);
        user.setEmail(cleanEmail);
        user.setUsername(email.split("@")[0]);
        user.setPassword(passwordService.hash(rawPassword));
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        user.setPhone(phone);
        user.setDepartment(dept);
        user.setLocation(loc);
        user.setJoinedAt(LocalDateTime.now().minusDays(30));
        user.setLastLogin(LocalDateTime.now().minusMinutes(15));
        userRepository.save(user);
    }

    private void seedRealCategories() {
        String[][] categories = {
                {"Antibiotics & Antimicrobials", "Broad-spectrum antibacterial, antifungal, and antimicrobial agents"},
                {"Analgesics & Anti-inflammatory", "NSAIDs, non-opioid pain modulators, and antipyretic formulations"},
                {"Cardiology & Antihypertensives", "Statins, ACE inhibitors, angiotensin receptor blockers, and beta-blockers"},
                {"Diabetology & Endocrine", "Oral hypoglycemics, biguanides, and hormone replacement regulators"},
                {"Gastroenterology & Antacids", "Proton-pump inhibitors, H2 receptor antagonists, and prokinetics"},
                {"Pulmonology & Respiratory", "Bronchodilators, inhaled corticosteroids, and respiratory respules"},
                {"Critical Care & Emergency Injectables", "Sterile parenteral infusions, anti-coagulants, and vasopressors"},
                {"Cold Chain & Biologics / Vaccines", "Strict 2°C to 8°C temperature-controlled insulins, peptides, and vaccines"},
                {"Neuropsychiatry & Sedatives", "Neurological modulators, antiepileptics, and anxiolytics"},
                {"Nutritional Supplements & Electrolytes", "Therapeutic multivitamins, mineral chelates, and parenteral electrolytes"}
        };

        for (String[] cat : categories) {
            Category category = new Category();
            category.setName(cat[0]);
            category.setDescription(cat[1]);
            category.setActive(true);
            categoryRepository.save(category);
        }
    }

    private void seedRealSuppliers() {
        Object[][] suppliers = {
                {
                        "Sun Pharmaceutical Industries Ltd.", "Dr. Rajesh Parekh", "+91 22 4324 4324",
                        "institutional.sales@sunpharma.com", "Sun House, CTS 201 B/1, Western Express Highway, Goregaon (E)",
                        "Mumbai", "Maharashtra", "400063", "27AAACS1084N1ZP", "MH-TZ4-284920", new BigDecimal("2500000.00"), "Net 30 Days"
                },
                {
                        "Cipla Ltd.", "Vikram Singhania", "+91 22 2482 6000",
                        "supplychain.orders@cipla.com", "Cipla House, Peninsula Business Park, Ganpatrao Kadam Marg, Lower Parel",
                        "Mumbai", "Maharashtra", "400013", "27AAACC2034G1Z1", "MH-MZ2-198421", new BigDecimal("2000000.00"), "Net 30 Days"
                },
                {
                        "Dr. Reddy's Laboratories", "K. Venkatraman", "+91 40 4900 2900",
                        "hospital.supplies@drreddys.com", "8-2-337, Road No. 3, Banjara Hills",
                        "Hyderabad", "Telangana", "500034", "36AAACD4991K1ZY", "TG-HYD-582910", new BigDecimal("1800000.00"), "Net 45 Days"
                },
                {
                        "Abbott India Ltd.", "Sanjeev Bhattacharya", "+91 22 3816 2000",
                        "pharma.distributors@abbott.in", "3-4, Corporate Park, Sion-Trombay Road, Chembur",
                        "Mumbai", "Maharashtra", "400071", "27AAACA1429B1Z0", "MH-CZ1-901842", new BigDecimal("3000000.00"), "Net 60 Days"
                },
                {
                        "GlaxoSmithKline Pharmaceuticals (GSK)", "Neha Sengupta", "+91 22 2495 9595",
                        "institutional.desk@gsk.com", "Dr. Annie Besant Road, Worli",
                        "Mumbai", "Maharashtra", "400030", "27AAACG0823H1ZW", "MH-WZ3-392019", new BigDecimal("1500000.00"), "Net 30 Days"
                },
                {
                        "Lupin Healthcare", "Amitav Roy", "+91 22 6640 2222",
                        "pharma.orders@lupin.com", "Kalpataru Inspire, 3rd Floor, Off Western Express Highway, Santacruz (E)",
                        "Mumbai", "Maharashtra", "400055", "27AAACL3401J1ZE", "MH-NZ1-482012", new BigDecimal("1600000.00"), "Net 30 Days"
                },
                {
                        "Torrent Pharmaceuticals", "Harish Patel", "+91 79 2685 0600",
                        "supply.west@torrentpharma.com", "Torrent House, Off Ashram Road",
                        "Ahmedabad", "Gujarat", "380009", "24AAACT2840M1Z8", "GJ-AH1-771920", new BigDecimal("1400000.00"), "Net 45 Days"
                },
                {
                        "Sanofi India Ltd.", "Marie D'Souza", "+91 22 2803 2000",
                        "insulin.care@sanofi.com", "Sanofi House, CTS No. 117-B, L&T Business Park, Saki Vihar Road, Powai",
                        "Mumbai", "Maharashtra", "400072", "27AAACS4920E1Z9", "MH-POW-839210", new BigDecimal("3500000.00"), "Net 45 Days"
                }
        };

        for (Object[] row : suppliers) {
            Supplier s = new Supplier();
            s.setCompanyName((String) row[0]);
            s.setContactPerson((String) row[1]);
            s.setPhone((String) row[2]);
            s.setEmail((String) row[3]);
            s.setAddress((String) row[4]);
            s.setCity((String) row[5]);
            s.setState((String) row[6]);
            s.setPostalCode((String) row[7]);
            s.setGstNumber((String) row[8]);
            s.setTaxNumber((String) row[9]);
            s.setCreditLimit((BigDecimal) row[10]);
            s.setPaymentTerms((String) row[11]);
            s.setSupplierType("Direct Manufacturer");
            s.setStatus(SupplierStatus.ACTIVE);
            s.setActive(true);
            supplierRepository.save(s);
        }
    }

    private void seedRealCatalogAndInventory() {
        List<Category> categories = categoryRepository.findAll();
        List<Supplier> suppliers = supplierRepository.findAll();

        Category antibiotics = findCategory(categories, "Antibiotics & Antimicrobials");
        Category analgesics = findCategory(categories, "Analgesics & Anti-inflammatory");
        Category cardiology = findCategory(categories, "Cardiology & Antihypertensives");
        Category diabetology = findCategory(categories, "Diabetology & Endocrine");
        Category gastro = findCategory(categories, "Gastroenterology & Antacids");
        Category pulmonology = findCategory(categories, "Pulmonology & Respiratory");
        Category criticalCare = findCategory(categories, "Critical Care & Emergency Injectables");
        Category coldChain = findCategory(categories, "Cold Chain & Biologics / Vaccines");
        Category supplements = findCategory(categories, "Nutritional Supplements & Electrolytes");

        Supplier gsk = findSupplier(suppliers, "GlaxoSmithKline");
        Supplier sun = findSupplier(suppliers, "Sun Pharmaceutical");
        Supplier cipla = findSupplier(suppliers, "Cipla");
        Supplier reddy = findSupplier(suppliers, "Dr. Reddy");
        Supplier abbott = findSupplier(suppliers, "Abbott");
        Supplier lupin = findSupplier(suppliers, "Lupin");
        Supplier torrent = findSupplier(suppliers, "Torrent");
        Supplier sanofi = findSupplier(suppliers, "Sanofi");

        LocalDate now = LocalDate.now();

        // 1. Augmentin 625 Duo
        createMedWithBatchAndInventory(
                "Augmentin 625 Duo", "Amoxicillin (500mg) + Clavulanic Acid (125mg)", antibiotics, gsk,
                "625mg", "Strip of 10 Tablets", new BigDecimal("204.50"), 60,
                "AUG24-819A", now.minusMonths(3), now.plusMonths(14), 420, "Rack A-01 (Main Warehouse)"
        );

        // 2. Dolo 650
        createMedWithBatchAndInventory(
                "Dolo 650", "Paracetamol IP (650mg)", analgesics, sun,
                "650mg", "Strip of 15 Tablets", new BigDecimal("33.60"), 150,
                "DL24-9042", now.minusMonths(2), now.plusMonths(18), 1250, "Rack A-04 (Main Warehouse)"
        );

        // 3. Azithral 500 (LOW STOCK ALERT)
        createMedWithBatchAndInventory(
                "Azithral 500", "Azithromycin Dihydrate IP (500mg)", antibiotics, lupin,
                "500mg", "Strip of 5 Tablets", new BigDecimal("132.00"), 50,
                "AZT23-4122", now.minusMonths(5), now.plusMonths(9), 18, "Rack A-02 (Branch Pharmacy)"
        );

        // 4. Pan 40
        createMedWithBatchAndInventory(
                "Pan 40", "Pantoprazole Gastro-resistant IP (40mg)", gastro, reddy,
                "40mg", "Strip of 15 Tablets", new BigDecimal("155.00"), 80,
                "PN24-1180", now.minusMonths(1), now.plusMonths(20), 680, "Rack B-01 (Main Warehouse)"
        );

        // 5. Telma 40
        createMedWithBatchAndInventory(
                "Telma 40", "Telmisartan IP (40mg)", cardiology, torrent,
                "40mg", "Strip of 15 Tablets", new BigDecimal("220.00"), 70,
                "TLM24-601", now.minusMonths(4), now.plusMonths(16), 540, "Rack B-03 (Main Warehouse)"
        );

        // 6. Glycomet GP 1
        createMedWithBatchAndInventory(
                "Glycomet GP 1", "Glimepiride (1mg) + Metformin HCl PR (500mg)", diabetology, abbott,
                "1mg / 500mg", "Strip of 15 Tablets", new BigDecimal("148.50"), 90,
                "GLY23-772", now.minusMonths(6), now.plusMonths(11), 820, "Rack C-01 (Main Warehouse)"
        );

        // 7. Lantus Solostar 100IU/ml (COLD CHAIN + NEAR EXPIRY IN 21 DAYS)
        createMedWithBatchAndInventory(
                "Lantus Solostar 100IU/ml", "Insulin Glargine recombinant DNA (100IU/ml)", coldChain, sanofi,
                "100IU/ml", "Pre-filled Pen (3ml)", new BigDecimal("685.00"), 25,
                "LNT24-009C", now.minusMonths(7), now.plusDays(21), 8, "Cold-Chain Refrigerator 01 (2°C - 8°C)"
        );

        // 8. Clexane 40mg / 0.4ml Injection
        createMedWithBatchAndInventory(
                "Clexane 40mg / 0.4ml", "Enoxaparin Sodium IP (4000 IU anti-Xa)", criticalCare, sanofi,
                "40mg / 0.4ml", "Pre-filled Syringe", new BigDecimal("512.00"), 30,
                "CLX24-411", now.minusMonths(2), now.plusMonths(13), 45, "Emergency Ward Cabinet"
        );

        // 9. Monocef 1g Injection
        createMedWithBatchAndInventory(
                "Monocef 1g Injection", "Ceftriaxone Sodium Sterile IP (1000mg)", criticalCare, sun,
                "1000mg", "Vial + Sterile Diluent", new BigDecimal("64.80"), 100,
                "MNC24-918", now.minusMonths(3), now.plusMonths(15), 340, "ICU Storage Bin-02"
        );

        // 10. Montair LC (LOW STOCK)
        createMedWithBatchAndInventory(
                "Montair LC", "Montelukast Sodium (10mg) + Levocetirizine (5mg)", pulmonology, cipla,
                "10mg / 5mg", "Strip of 10 Tablets", new BigDecimal("198.00"), 60,
                "MLC23-551", now.minusMonths(5), now.plusMonths(7), 22, "Rack D-02 (Branch Pharmacy)"
        );

        // 11. Budecort 0.5mg Respules
        createMedWithBatchAndInventory(
                "Budecort 0.5mg Respules", "Budesonide Nebuliser Suspension (0.5mg/2ml)", pulmonology, cipla,
                "0.5mg / 2ml", "Pack of 5 Respules", new BigDecimal("125.00"), 40,
                "BDC24-301", now.minusMonths(2), now.plusMonths(17), 190, "Respiratory Ward A"
        );

        // 12. Omez 20mg Capsules
        createMedWithBatchAndInventory(
                "Omez 20mg Capsules", "Omeprazole IP (20mg Gastro-resistant)", gastro, reddy,
                "20mg", "Strip of 20 Capsules", new BigDecimal("95.00"), 80,
                "OMZ24-812", now.minusMonths(1), now.plusMonths(19), 410, "Rack B-02 (Main Warehouse)"
        );

        // 13. Ecosprin 75
        createMedWithBatchAndInventory(
                "Ecosprin 75", "Aspirin Gastro-resistant IP (75mg)", cardiology, torrent,
                "75mg", "Strip of 14 Tablets", new BigDecimal("9.80"), 120,
                "ECO23-019", now.minusMonths(4), now.plusMonths(22), 1850, "Rack B-04 (Main Warehouse)"
        );

        // 14. Becosules Z Capsules
        createMedWithBatchAndInventory(
                "Becosules Z", "Vitamin B-Complex + Vitamin C + Zinc Sulphate", supplements, sun,
                "Capsule", "Strip of 20 Capsules", new BigDecimal("52.40"), 100,
                "BCZ24-602", now.minusMonths(3), now.plusMonths(24), 760, "Rack E-01 (Main Warehouse)"
        );

        // 15. Betadine 10% Solution
        createMedWithBatchAndInventory(
                "Betadine 10% Solution", "Povidone-Iodine IP 10% w/v Antiseptic", criticalCare, gsk,
                "10% w/v", "Bottle of 100ml", new BigDecimal("142.00"), 35,
                "BTD23-909", now.minusMonths(6), now.plusMonths(12), 62, "OT Sterile Store"
        );

        // 16. Ascoril LS Syrup (EXPIRED 5 DAYS AGO)
        createMedWithBatchAndInventory(
                "Ascoril LS Syrup", "Levosalbutamol + Ambroxol HCl + Guaiphenesin", pulmonology, cipla,
                "Syrup 100ml", "Bottle of 100ml", new BigDecimal("118.00"), 50,
                "ASC23-112", now.minusMonths(15), now.minusDays(5), 14, "Quarantine Bay (Expired)"
        );

        // 17. Clavam 625 Tablets
        createMedWithBatchAndInventory(
                "Clavam 625 Tablets", "Amoxicillin (500mg) + Potassium Clavulanate (125mg)", antibiotics, reddy,
                "625mg", "Strip of 10 Tablets", new BigDecimal("215.00"), 50,
                "CLV23-991", now.minusMonths(4), now.plusMonths(10), 310, "Rack A-03 (Main Warehouse)"
        );

        // 18. Rozavel 10
        createMedWithBatchAndInventory(
                "Rozavel 10", "Rosuvastatin IP (10mg)", cardiology, sun,
                "10mg", "Strip of 15 Tablets", new BigDecimal("245.00"), 40,
                "RZV24-402", now.minusMonths(3), now.plusMonths(18), 380, "Rack B-05 (Main Warehouse)"
        );

        // 19. Dynapar AQ 75mg Injection
        createMedWithBatchAndInventory(
                "Dynapar AQ 75mg Injection", "Diclofenac Sodium (75mg/1ml)", analgesics, torrent,
                "75mg / 1ml", "Ampoule of 1ml", new BigDecimal("28.50"), 80,
                "DNP24-015", now.minusMonths(2), now.plusMonths(14), 420, "Emergency Ward Cabinet"
        );

        // 20. Ondem 4mg Tablets (OUT OF STOCK - 0 UNITS)
        createMedWithBatchAndInventory(
                "Ondem 4mg Tablets", "Ondansetron HCl IP (4mg)", gastro, cipla,
                "4mg", "Strip of 10 Tablets", new BigDecimal("58.00"), 60,
                "OND24-781", now.minusMonths(5), now.plusMonths(8), 0, "Rack B-02 (Branch Pharmacy)"
        );

        // 21. Shelcal 500
        createMedWithBatchAndInventory(
                "Shelcal 500", "Calcium Carbonate (500mg elemental) + Vitamin D3 (250 IU)", supplements, torrent,
                "500mg", "Strip of 15 Tablets", new BigDecimal("131.00"), 75,
                "SHC24-219", now.minusMonths(3), now.plusMonths(21), 890, "Rack E-02 (Main Warehouse)"
        );

        // 22. Covishield Vaccine (COLD CHAIN + NEAR EXPIRY IN 14 DAYS)
        createMedWithBatchAndInventory(
                "Covishield Vaccine", "ChAdOx1 nCoV-19 Coronavirus Recombinant", coldChain, abbott,
                "0.5ml / dose", "10-Dose Vial (5ml)", new BigDecimal("780.00"), 20,
                "CV24-8891", now.minusMonths(8), now.plusDays(14), 12, "Cold-Chain Refrigerator 02 (2°C - 8°C)"
        );

        // 23. Norflox TZ
        createMedWithBatchAndInventory(
                "Norflox TZ", "Norfloxacin (400mg) + Tinidazole (600mg)", antibiotics, cipla,
                "400mg / 600mg", "Strip of 10 Tablets", new BigDecimal("108.00"), 45,
                "NFZ23-304", now.minusMonths(4), now.plusMonths(12), 215, "Rack A-05 (Branch Pharmacy)"
        );

        // 24. Combiflam
        createMedWithBatchAndInventory(
                "Combiflam", "Ibuprofen IP (400mg) + Paracetamol IP (325mg)", analgesics, sanofi,
                "400mg / 325mg", "Strip of 20 Tablets", new BigDecimal("46.20"), 120,
                "CMB24-601", now.minusMonths(2), now.plusMonths(25), 1120, "Rack A-06 (Main Warehouse)"
        );

        // 25. Meropenem 1g Injection
        createMedWithBatchAndInventory(
                "Meropenem 1g Injection", "Meropenem Trihydrate IP Sterile (1000mg)", criticalCare, lupin,
                "1000mg", "Sterile IV Infusion Vial", new BigDecimal("950.00"), 30,
                "MER24-118", now.minusMonths(1), now.plusMonths(16), 58, "ICU Storage Bin-01"
        );
    }

    private void createMedWithBatchAndInventory(
            String name, String generic, Category category, Supplier supplier,
            String dosage, String unit, BigDecimal price, int reorderLevel,
            String batchNo, LocalDate mfgDate, LocalDate expDate, int qty, String location) {

        Medicine medicine = new Medicine();
        medicine.setName(name);
        medicine.setGenericName(generic);
        medicine.setCategory(category);
        medicine.setSupplier(supplier);
        medicine.setDosage(dosage);
        medicine.setUnit(unit);
        medicine.setPrice(price);
        medicine.setReorderLevel(reorderLevel);
        medicine.setActive(true);
        medicine = medicineRepository.save(medicine);

        Batch batch = new Batch();
        batch.setBatchNumber(batchNo);
        batch.setMedicine(medicine);
        batch.setManufacturingDate(mfgDate);
        batch.setExpiryDate(expDate);
        batch.setQuantity(qty);
        batch.setActive(true);
        batch = batchRepository.save(batch);

        Inventory inventory = new Inventory();
        inventory.setMedicine(medicine);
        inventory.setBatch(batch);
        inventory.setQuantity(qty);
        inventory.setAvailableQuantity(qty);
        inventory.setReservedQuantity(0);
        inventory.setReorderLevel(reorderLevel);
        inventory.setLocation(location);
        inventory.setActive(true);
        inventory = inventoryRepository.save(inventory);

        // GxP Compliance Audit Stock Movement Log
        StockLog log = new StockLog();
        log.setInventory(inventory);
        log.setMedicine(medicine);
        log.setOperation(StockOperation.STOCK_IN);
        log.setQuantity(qty);
        log.setPreviousQuantity(0);
        log.setNewQuantity(qty);
        log.setReason("Inward Consignment Verified - GRN/" + batchNo);
        log.setReferenceNumber("GRN-" + batchNo);
        log.setPerformedBy("Priya Mehta, R.Ph.");
        stockLogRepository.save(log);

        // Register Low Stock or Out of Stock Alert if breached
        if (qty <= reorderLevel) {
            LowStockAlert alert = new LowStockAlert();
            alert.setMedicine(medicine);
            alert.setCurrentStock(qty);
            alert.setReorderLevel(reorderLevel);
            alert.setReorderQuantity(reorderLevel * 2);
            alert.setStatus(qty == 0 ? StockAlertStatus.OUT_OF_STOCK : StockAlertStatus.CRITICAL);
            alert.setNotificationSent(true);
            alert.setNotificationSentAt(LocalDateTime.now().minusHours(2));
            lowStockAlertRepository.save(alert);
        }
    }

    private void seedRealPurchaseOrders() {
        List<Supplier> suppliers = supplierRepository.findAll();
        List<Medicine> medicines = medicineRepository.findAll();
        if (suppliers.isEmpty() || medicines.isEmpty()) return;

        LocalDate now = LocalDate.now();

        // PO 1: Sanofi India - Cold Chain Insulin & Injections
        Supplier sanofi = findSupplier(suppliers, "Sanofi");
        Medicine lantus = findMedicine(medicines, "Lantus");
        Medicine clexane = findMedicine(medicines, "Clexane");
        if (sanofi != null && lantus != null && clexane != null) {
            createPurchaseOrder("PO-2026-1044", sanofi, now.minusDays(6), now.minusDays(1),
                    PurchaseOrderStatus.RECEIVED, "PAID", "RECEIVED", "Dr. Ajay Sharma",
                    "Emergency cold-chain insulin and anticoagulant ward replenishment",
                    List.of(
                            new POItemDTO(lantus, "LNT24-009C", 100, 100, lantus.getPrice()),
                            new POItemDTO(clexane, "CLX24-411", 50, 50, clexane.getPrice())
                    ));
        }

        // PO 2: GlaxoSmithKline - Augmentin & Betadine
        Supplier gsk = findSupplier(suppliers, "GlaxoSmithKline");
        Medicine augmentin = findMedicine(medicines, "Augmentin");
        Medicine betadine = findMedicine(medicines, "Betadine");
        if (gsk != null && augmentin != null && betadine != null) {
            createPurchaseOrder("PO-2026-1045", gsk, now.minusDays(3), now.plusDays(2),
                    PurchaseOrderStatus.ORDERED, "PAID", "IN_TRANSIT", "Priya Mehta, R.Ph.",
                    "Quarterly OT antiseptic and antibiotic restock batch",
                    List.of(
                            new POItemDTO(augmentin, "AUG24-819A", 300, 0, augmentin.getPrice()),
                            new POItemDTO(betadine, "BTD23-909", 100, 0, betadine.getPrice())
                    ));
        }

        // PO 3: Sun Pharma - Dolo 650 & Monocef
        Supplier sun = findSupplier(suppliers, "Sun Pharmaceutical");
        Medicine dolo = findMedicine(medicines, "Dolo 650");
        Medicine monocef = findMedicine(medicines, "Monocef");
        if (sun != null && dolo != null && monocef != null) {
            createPurchaseOrder("PO-2026-1046", sun, now.minusDays(1), now.plusDays(4),
                    PurchaseOrderStatus.PENDING, "PENDING", "PENDING", "Dr. Ajay Sharma",
                    "Routine inpatient hospital bulk analgesics and ICU antibiotics",
                    List.of(
                            new POItemDTO(dolo, "DL24-9042", 1000, 0, dolo.getPrice()),
                            new POItemDTO(monocef, "MNC24-918", 200, 0, monocef.getPrice())
                    ));
        }

        // PO 4: Cipla - Montair LC & Ondem 4mg (Replenishing Out of Stock item!)
        Supplier cipla = findSupplier(suppliers, "Cipla");
        Medicine ondem = findMedicine(medicines, "Ondem 4mg");
        Medicine montair = findMedicine(medicines, "Montair LC");
        if (cipla != null && ondem != null && montair != null) {
            createPurchaseOrder("PO-2026-1047", cipla, now, now.plusDays(3),
                    PurchaseOrderStatus.DRAFT, "PENDING", "PENDING", "Priya Mehta, R.Ph.",
                    "Urgent stock replenishment for depleted Ondem 4mg and low Montair LC",
                    List.of(
                            new POItemDTO(ondem, "OND24-781", 300, 0, ondem.getPrice()),
                            new POItemDTO(montair, "MLC23-551", 150, 0, montair.getPrice())
                    ));
        }
    }

    private static class POItemDTO {
        Medicine med;
        String batch;
        int qty;
        int received;
        BigDecimal price;

        POItemDTO(Medicine med, String batch, int qty, int received, BigDecimal price) {
            this.med = med;
            this.batch = batch;
            this.qty = qty;
            this.received = received;
            this.price = price;
        }
    }

    private void createPurchaseOrder(String poNum, Supplier supplier, LocalDate orderDate, LocalDate expDate,
                                    PurchaseOrderStatus status, String payStatus, String recStatus,
                                    String createdBy, String notes, List<POItemDTO> items) {
        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber(poNum);
        po.setSupplier(supplier);
        po.setOrderDate(orderDate);
        po.setExpectedDate(expDate);
        po.setStatus(status);
        po.setPaymentStatus(payStatus);
        po.setReceivingStatus(recStatus);
        po.setCreatedBy(createdBy);
        po.setNotes(notes);

        BigDecimal subtotal = BigDecimal.ZERO;
        for (POItemDTO itemDto : items) {
            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setPurchaseOrder(po);
            item.setMedicine(itemDto.med);
            item.setBatchNumber(itemDto.batch);
            item.setOrderedQuantity(itemDto.qty);
            item.setReceivedQuantity(itemDto.received);
            item.setUnitPrice(itemDto.price);
            BigDecimal itemTotal = itemDto.price.multiply(BigDecimal.valueOf(itemDto.qty));
            item.setTotalPrice(itemTotal);
            subtotal = subtotal.add(itemTotal);
            po.getItems().add(item);
        }

        BigDecimal tax = subtotal.multiply(new BigDecimal("0.12")).setScale(2, RoundingMode.HALF_UP);
        po.setSubtotal(subtotal);
        po.setTax(tax);
        po.setTotalAmount(subtotal.add(tax));
        purchaseOrderRepository.save(po);
    }

    private void seedRealOnlineOrders() {
        List<Medicine> medicines = medicineRepository.findAll();
        if (medicines.isEmpty()) return;

        Medicine augmentin = findMedicine(medicines, "Augmentin");
        Medicine pan40 = findMedicine(medicines, "Pan 40");
        Medicine dolo = findMedicine(medicines, "Dolo 650");
        Medicine montair = findMedicine(medicines, "Montair LC");
        Medicine lantus = findMedicine(medicines, "Lantus");
        Medicine glycomet = findMedicine(medicines, "Glycomet");
        Medicine telma = findMedicine(medicines, "Telma 40");
        Medicine ecosprin = findMedicine(medicines, "Ecosprin");
        Medicine becosules = findMedicine(medicines, "Becosules");
        Medicine shelcal = findMedicine(medicines, "Shelcal");

        LocalDateTime now = LocalDateTime.now();

        // 1. Apollo 24/7 - Delivered
        createOnlineOrder("ORD-2026-8801", "Apollo 24/7", "Rahul Verma", "rahul.verma@gmail.com", "+91 98201 12345",
                "Flat 402, Sea View Heights, Bandra West", "Mumbai", "Maharashtra", "400050",
                OnlineOrderStatus.DELIVERED, PaymentStatus.PAID, "UPI", now.minusHours(8),
                List.of(
                        new OrderItemDTO(augmentin, "AUG24-819A", 2, augmentin.getPrice()),
                        new OrderItemDTO(pan40, "PN24-1180", 1, pan40.getPrice())
                ));

        // 2. Tata 1mg - Out for Delivery
        createOnlineOrder("ORD-2026-8802", "Tata 1mg", "Ananya Mukherjee", "ananya.m@outlook.com", "+91 98302 23456",
                "Tower 3, Apt 11B, Silver Springs, Salt Lake Sector V", "Kolkata", "West Bengal", "700091",
                OnlineOrderStatus.OUT_FOR_DELIVERY, PaymentStatus.PAID, "Credit Card", now.minusHours(4),
                List.of(
                        new OrderItemDTO(dolo, "DL24-9042", 4, dolo.getPrice()),
                        new OrderItemDTO(montair, "MLC23-551", 2, montair.getPrice())
                ));

        // 3. PharmEasy - Processing (Cold Chain)
        createOnlineOrder("ORD-2026-8803", "PharmEasy", "Suresh Iyer", "suresh.iyer@techcorp.in", "+91 98450 34567",
                "No. 42, 7th Main, 4th Cross, Indiranagar", "Bengaluru", "Karnataka", "560038",
                OnlineOrderStatus.PROCESSING, PaymentStatus.PAID, "NetBanking", now.minusHours(2),
                List.of(
                        new OrderItemDTO(lantus, "LNT24-009C", 1, lantus.getPrice()),
                        new OrderItemDTO(glycomet, "GLY23-772", 2, glycomet.getPrice())
                ));

        // 4. WhatsApp Prescription - Confirmed
        createOnlineOrder("ORD-2026-8804", "WhatsApp Rx", "Sunita Kulkarni", "sunita.kulkarni@yahoo.com", "+91 98223 45678",
                "Bungalow 7, Mayur Colony, Kothrud", "Pune", "Maharashtra", "411038",
                OnlineOrderStatus.CONFIRMED, PaymentStatus.PENDING, "Cash on Delivery", now.minusMinutes(45),
                List.of(
                        new OrderItemDTO(telma, "TLM24-601", 2, telma.getPrice()),
                        new OrderItemDTO(ecosprin, "ECO23-019", 2, ecosprin.getPrice())
                ));

        // 5. MediStock Direct Portal - Pending Verification
        createOnlineOrder("ORD-2026-8805", "MediStock Direct", "Deepak Chopra", "deepak.chopra@healthmail.com", "+91 98110 56789",
                "House 14, Barakhamba Road, Connaught Place", "New Delhi", "Delhi", "110001",
                OnlineOrderStatus.PENDING, PaymentStatus.PAID, "UPI", now.minusMinutes(15),
                List.of(
                        new OrderItemDTO(becosules, "BCZ24-602", 3, becosules.getPrice()),
                        new OrderItemDTO(shelcal, "SHC24-219", 2, shelcal.getPrice())
                ));
    }

    private static class OrderItemDTO {
        Medicine med;
        String batch;
        int qty;
        BigDecimal price;

        OrderItemDTO(Medicine med, String batch, int qty, BigDecimal price) {
            this.med = med;
            this.batch = batch;
            this.qty = qty;
            this.price = price;
        }
    }

    private void createOnlineOrder(String orderNum, String platform, String customer, String email, String phone,
                                   String address, String city, String state, String zip,
                                   OnlineOrderStatus status, PaymentStatus payStatus, String payMethod,
                                   LocalDateTime orderDate, List<OrderItemDTO> items) {
        OnlineOrder order = new OnlineOrder();
        order.setOrderNumber(orderNum);
        order.setPlatformName(platform);
        order.setCustomerName(customer);
        order.setCustomerEmail(email);
        order.setCustomerPhone(phone);
        order.setDeliveryAddress(address);
        order.setCity(city);
        order.setState(state);
        order.setPostalCode(zip);
        order.setStatus(status);
        order.setPaymentStatus(payStatus);
        order.setPaymentMethod(payMethod);
        order.setOrderDate(orderDate);

        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItemDTO dto : items) {
            OnlineOrderItem item = new OnlineOrderItem();
            item.setOnlineOrder(order);
            item.setMedicine(dto.med);
            item.setMedicineName(dto.med != null ? dto.med.getName() : "Prescription Formulation");
            item.setBatchNumber(dto.batch);
            item.setQuantity(dto.qty);
            item.setUnitPrice(dto.price);
            BigDecimal lineTotal = dto.price.multiply(BigDecimal.valueOf(dto.qty));
            item.setTotalPrice(lineTotal);
            subtotal = subtotal.add(lineTotal);
            order.getItems().add(item);
        }

        BigDecimal tax = subtotal.multiply(new BigDecimal("0.12")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal delivery = new BigDecimal("35.00");
        order.setSubtotal(subtotal);
        order.setTax(tax);
        order.setDeliveryCharge(delivery);
        order.setTotalAmount(subtotal.add(tax).add(delivery));
        onlineOrderRepository.save(order);
    }

    private void seedRealNotificationsAndAlerts() {
        List<Medicine> meds = medicineRepository.findAll();
        List<Batch> batches = batchRepository.findAll();

        Medicine lantus = findMedicine(meds, "Lantus");
        Batch lantusBatch = findBatch(batches, "LNT24-009C");
        Medicine ascoril = findMedicine(meds, "Ascoril");
        Batch ascorilBatch = findBatch(batches, "ASC23-112");
        Medicine ondem = findMedicine(meds, "Ondem");
        Batch ondemBatch = findBatch(batches, "OND24-781");
        Medicine azithral = findMedicine(meds, "Azithral");
        Batch azithralBatch = findBatch(batches, "AZT23-4122");

        createNotification(
                "Critical Batch Expiry Detected",
                "Ascoril LS Syrup (Batch ASC23-112) expired 5 days ago. Immediate quarantine protocol mandated by GxP standards.",
                NotificationType.EXPIRY, NotificationPriority.CRITICAL, NotificationStatus.NEW, ascoril, ascorilBatch
        );

        createNotification(
                "Cold-Chain Near Expiry (21 Days Remaining)",
                "Lantus Solostar 100IU/ml (Batch LNT24-009C, Cold-Chain Unit 01) requires First-Expiry-First-Out (FEFO) dispensing.",
                NotificationType.NEAR_EXPIRY, NotificationPriority.CRITICAL, NotificationStatus.NEW, lantus, lantusBatch
        );

        createNotification(
                "Stock Out Alert: Ondem 4mg",
                "Ondem 4mg is completely OUT OF STOCK (0 units available). Purchase Order PO-2026-1047 created with Cipla Ltd.",
                NotificationType.LOW_STOCK, NotificationPriority.CRITICAL, NotificationStatus.NEW, ondem, ondemBatch
        );

        createNotification(
                "Low Inventory Alert: Azithral 500",
                "Azithral 500 inventory in Branch Pharmacy has dropped to 18 units, below the safety threshold of 50 units.",
                NotificationType.LOW_STOCK, NotificationPriority.WARNING, NotificationStatus.READ, azithral, azithralBatch
        );

        createNotification(
                "Consignment GRN Confirmed",
                "Purchase order shipment PO-2026-1044 from Sanofi India Ltd. received, quality inspected, and shelf-allocated.",
                NotificationType.PURCHASE, NotificationPriority.INFO, NotificationStatus.READ, lantus, lantusBatch
        );
    }

    private void createNotification(String title, String message, NotificationType type,
                                    NotificationPriority priority, NotificationStatus status,
                                    Medicine medicine, Batch batch) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setDescription(message);
        notification.setType(type);
        notification.setPriority(priority);
        notification.setStatus(status);
        notification.setChannel(NotificationChannel.IN_APP);
        notification.setMedicine(medicine);
        notification.setBatch(batch);
        notificationRepository.save(notification);
    }

    private void seedRealReports() {
        createReport("Comprehensive Clinical Inventory Valuation Q3", ReportType.INVENTORY_VALUATION, ReportFormat.PDF,
                ReportStatus.SUCCESS, LocalDate.now().minusDays(30), LocalDate.now(), "Dr. Ajay Sharma");

        createReport("GxP Regulatory Expiry & Quarantine Audit", ReportType.EXPIRY_ANALYSIS, ReportFormat.EXCEL,
                ReportStatus.SUCCESS, LocalDate.now().minusDays(15), LocalDate.now(), "Priya Mehta, R.Ph.");

        createReport("Critical Ward Dispensing & Stock Log Reconciliation", ReportType.STOCK_MOVEMENT, ReportFormat.PDF,
                ReportStatus.SUCCESS, LocalDate.now().minusDays(14), LocalDate.now(), "Rohit Kumar");

        createReport("Pharmaceutical Vendor Lead-Time & Delivery Scorecard", ReportType.SUPPLIER_SUMMARY, ReportFormat.EXCEL,
                ReportStatus.SUCCESS, LocalDate.now().minusDays(60), LocalDate.now(), "Dr. Ajay Sharma");

        createReport("Emergency Replenishment PO Fulfillment Log", ReportType.PURCHASE_ORDER, ReportFormat.PDF,
                ReportStatus.SUCCESS, LocalDate.now().minusDays(7), LocalDate.now(), "Priya Mehta, R.Ph.");
    }

    private void createReport(String name, ReportType type, ReportFormat format, ReportStatus status,
                              LocalDate from, LocalDate to, String generatedBy) {
        Report report = new Report();
        report.setReportName(name);
        report.setReportType(type);
        report.setFormat(format);
        report.setStatus(status);
        report.setFromDate(from);
        report.setToDate(to);
        report.setGeneratedBy(generatedBy);
        report.setGeneratedAt(LocalDateTime.now().minusDays(1));
        reportRepository.save(report);
    }

    private Category findCategory(List<Category> list, String name) {
        return list.stream().filter(c -> c.getName() != null && c.getName().toLowerCase().contains(name.toLowerCase()))
                .findFirst().orElse(null);
    }

    private Supplier findSupplier(List<Supplier> list, String name) {
        return list.stream().filter(s -> s.getCompanyName() != null && s.getCompanyName().toLowerCase().contains(name.toLowerCase()))
                .findFirst().orElse(null);
    }

    private Medicine findMedicine(List<Medicine> list, String name) {
        return list.stream().filter(m -> m.getName() != null && m.getName().toLowerCase().contains(name.toLowerCase()))
                .findFirst().orElse(null);
    }

    private Batch findBatch(List<Batch> list, String batchNo) {
        return list.stream().filter(b -> b.getBatchNumber() != null && b.getBatchNumber().equalsIgnoreCase(batchNo))
                .findFirst().orElse(null);
    }
}
