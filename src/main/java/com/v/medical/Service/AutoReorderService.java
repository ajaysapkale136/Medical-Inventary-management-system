package com.v.medical.Service;

import com.v.medical.entity.*;
import com.v.medical.repository.InventoryRepository;
import com.v.medical.repository.PurchaseOrderRepository;
import com.v.medical.repository.SupplierRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AutoReorderService {

    private static final Logger log = LoggerFactory.getLogger(AutoReorderService.class);

    private final InventoryRepository inventoryRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;

    public AutoReorderService(
            InventoryRepository inventoryRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            SupplierRepository supplierRepository) {
        this.inventoryRepository = inventoryRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.supplierRepository = supplierRepository;
    }

    /**
     * Nightly cron job to scan low inventory and trigger auto-reorders at 02:00 AM.
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void scheduledAutoReorder() {
        log.info("Starting automated low-stock reorder scan...");
        Map<String, Object> result = processAutoReorder("SYSTEM_CRON");
        log.info("Automated reorder scan finished. Result: {}", result);
    }

    /**
     * On-demand trigger for reordering low stock medicines.
     */
    @Transactional
    public Map<String, Object> triggerManualReorder(String triggeredBy) {
        return processAutoReorder(triggeredBy != null ? triggeredBy : "ADMIN");
    }

    @Transactional
    public Map<String, Object> processAutoReorder(String triggeredBy) {
        List<Inventory> allInventory = inventoryRepository.findByActiveTrue();
        List<Inventory> lowStockItems = new ArrayList<>();

        for (Inventory inv : allInventory) {
            int qty = inv.getQuantity() != null ? inv.getQuantity() : 0;
            int reorder = inv.getReorderLevel() != null ? inv.getReorderLevel() : 10;
            if (qty <= reorder) {
                lowStockItems.add(inv);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("scannedItems", allInventory.size());
        response.put("lowStockCount", lowStockItems.size());

        if (lowStockItems.isEmpty()) {
            response.put("message", "All inventory items are currently above their reorder thresholds.");
            response.put("createdOrders", Collections.emptyList());
            return response;
        }

        // Group by supplier
        Map<Supplier, List<Inventory>> supplierMap = new HashMap<>();
        List<Supplier> activeSuppliers = supplierRepository.findByStatusOrderByCompanyNameAsc(SupplierStatus.ACTIVE);
        Supplier fallbackSupplier = activeSuppliers.isEmpty() ? null : activeSuppliers.get(0);

        for (Inventory inv : lowStockItems) {
            Medicine med = inv.getMedicine();
            Supplier supp = med != null ? med.getSupplier() : null;
            if (supp == null) {
                supp = fallbackSupplier;
            }
            if (supp != null) {
                supplierMap.computeIfAbsent(supp, k -> new ArrayList<>()).add(inv);
            }
        }

        List<Map<String, Object>> createdOrders = new ArrayList<>();

        for (Map.Entry<Supplier, List<Inventory>> entry : supplierMap.entrySet()) {
            Supplier supplier = entry.getKey();
            List<Inventory> items = entry.getValue();

            // Check if there's already an active open PO for this supplier
            List<PurchaseOrder> openOrders = purchaseOrderRepository.findBySupplierId(supplier.getId());
            boolean alreadyPending = openOrders.stream().anyMatch(po ->
                    po.getStatus() == PurchaseOrderStatus.DRAFT ||
                    po.getStatus() == PurchaseOrderStatus.PENDING ||
                    po.getStatus() == PurchaseOrderStatus.ORDERED
            );

            if (alreadyPending) {
                log.info("Skipping supplier {} as an active purchase order is already in progress.", supplier.getName());
                continue;
            }

            // Create new DRAFT Purchase Order
            String poNumber = "PO-AUTO-" + System.currentTimeMillis() % 1000000;
            PurchaseOrder po = new PurchaseOrder();
            po.setPoNumber(poNumber);
            po.setSupplier(supplier);
            po.setOrderDate(LocalDate.now());
            po.setExpectedDate(LocalDate.now().plusDays(7));
            po.setStatus(PurchaseOrderStatus.DRAFT);
            po.setCreatedBy("AUTO_REORDER (" + triggeredBy + ")");
            po.setNotes("Automated reorder triggered due to inventory falling below threshold levels.");

            BigDecimal subtotal = BigDecimal.ZERO;

            for (Inventory inv : items) {
                Medicine med = inv.getMedicine();
                if (med == null) continue;

                int currentQty = inv.getQuantity() != null ? inv.getQuantity() : 0;
                int threshold = inv.getReorderLevel() != null ? inv.getReorderLevel() : 10;
                int orderQty = Math.max((threshold * 3) - currentQty, 50);

                BigDecimal unitPrice = med.getPrice() != null ? med.getPrice() : BigDecimal.valueOf(10.00);

                PurchaseOrderItem item = new PurchaseOrderItem();
                item.setPurchaseOrder(po);
                item.setMedicine(med);
                item.setOrderedQuantity(orderQty);
                item.setReceivedQuantity(0);
                item.setUnitPrice(unitPrice);
                item.setTax(BigDecimal.ZERO);
                item.setDiscount(BigDecimal.ZERO);
                BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(orderQty));
                item.setTotalPrice(lineTotal);

                po.getItems().add(item);
                subtotal = subtotal.add(lineTotal);
            }

            if (po.getItems().isEmpty()) {
                continue;
            }

            BigDecimal taxRate = BigDecimal.valueOf(0.05); // 5% GST/Tax
            BigDecimal taxAmount = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal totalAmount = subtotal.add(taxAmount);

            po.setSubtotal(subtotal);
            po.setTax(taxAmount);
            po.setTotalAmount(totalAmount);

            PurchaseOrder savedPo = purchaseOrderRepository.save(po);

            Map<String, Object> orderSummary = new HashMap<>();
            orderSummary.put("poId", savedPo.getId());
            orderSummary.put("poNumber", savedPo.getPoNumber());
            orderSummary.put("supplier", supplier.getName());
            orderSummary.put("itemCount", savedPo.getItems().size());
            orderSummary.put("totalAmount", savedPo.getTotalAmount());
            createdOrders.add(orderSummary);
        }

        response.put("message", "Auto-reorder process completed. Created " + createdOrders.size() + " purchase order(s).");
        response.put("createdOrders", createdOrders);
        return response;
    }
}
