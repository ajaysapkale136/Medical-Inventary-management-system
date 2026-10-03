package com.v.medical.Service;

import com.v.medical.entity.Batch;
import com.v.medical.entity.Inventory;
import com.v.medical.entity.Medicine;
import com.v.medical.repository.BatchRepository;
import com.v.medical.repository.InventoryRepository;
import com.v.medical.repository.MedicineRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class BarcodeScanService {

    private final BatchRepository batchRepository;
    private final MedicineRepository medicineRepository;
    private final InventoryRepository inventoryRepository;

    public BarcodeScanService(
            BatchRepository batchRepository,
            MedicineRepository medicineRepository,
            InventoryRepository inventoryRepository) {
        this.batchRepository = batchRepository;
        this.medicineRepository = medicineRepository;
        this.inventoryRepository = inventoryRepository;
    }

    public Map<String, Object> scan(String rawCode) {
        Map<String, Object> result = new HashMap<>();
        if (rawCode == null || rawCode.trim().isEmpty()) {
            result.put("found", false);
            result.put("message", "Empty barcode or identifier provided.");
            return result;
        }

        String code = rawCode.trim();

        // 1. Check exact Batch Number
        Optional<Batch> batchOpt = batchRepository.findByBatchNumber(code);
        if (batchOpt.isPresent()) {
            return buildBatchResponse(batchOpt.get(), code, "EXACT_BATCH");
        }

        // 2. Check partial/case-insensitive Batch Number
        List<Batch> partialBatches = batchRepository.findByBatchNumberContainingIgnoreCase(code);
        if (!partialBatches.isEmpty()) {
            return buildBatchResponse(partialBatches.get(0), code, "PARTIAL_BATCH");
        }

        // 3. Check if numeric ID for Medicine
        if (code.matches("\\d+")) {
            try {
                Long medId = Long.parseLong(code);
                Optional<Medicine> medOpt = medicineRepository.findById(medId);
                if (medOpt.isPresent()) {
                    return buildMedicineResponse(medOpt.get(), code, "MEDICINE_ID");
                }
            } catch (NumberFormatException ignored) {}
        }

        // 4. Check Medicine Name match
        List<Medicine> meds = medicineRepository.findByNameContainingIgnoreCase(code);
        if (!meds.isEmpty()) {
            return buildMedicineResponse(meds.get(0), code, "MEDICINE_NAME");
        }

        result.put("found", false);
        result.put("query", code);
        result.put("message", "No active medicine or batch found matching code: " + code);
        return result;
    }

    private Map<String, Object> buildBatchResponse(Batch batch, String query, String matchType) {
        Map<String, Object> res = new HashMap<>();
        res.put("found", true);
        res.put("matchType", matchType);
        res.put("query", query);

        Medicine med = batch.getMedicine();
        res.put("batchId", batch.getId());
        res.put("batchNumber", batch.getBatchNumber());
        res.put("quantity", batch.getQuantity());
        res.put("manufacturingDate", batch.getManufacturingDate() != null ? batch.getManufacturingDate().toString() : null);
        res.put("expiryDate", batch.getExpiryDate() != null ? batch.getExpiryDate().toString() : null);

        if (batch.getExpiryDate() != null) {
            long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), batch.getExpiryDate());
            res.put("daysUntilExpiry", daysLeft);
            res.put("isExpired", daysLeft < 0);
            res.put("isNearExpiry", daysLeft >= 0 && daysLeft <= 60);
        }

        if (med != null) {
            res.put("medicineId", med.getId());
            res.put("medicineName", med.getName());
            res.put("genericName", med.getGenericName());
            res.put("dosage", med.getDosage());
            res.put("unit", med.getUnit());
            res.put("price", med.getPrice());
            res.put("category", med.getCategory() != null ? med.getCategory().getName() : null);
            res.put("supplier", med.getSupplier() != null ? med.getSupplier().getName() : null);
        }

        // Find inventory details (shelf location, available qty)
        inventoryRepository.findByBatchId(batch.getId()).ifPresent(inv -> {
            res.put("inventoryId", inv.getId());
            res.put("location", inv.getLocation() != null ? inv.getLocation() : "Standard Pharmacy Shelf");
            res.put("availableQuantity", inv.getAvailableQuantity() != null ? inv.getAvailableQuantity() : inv.getQuantity());
        });

        return res;
    }

    private Map<String, Object> buildMedicineResponse(Medicine med, String query, String matchType) {
        Map<String, Object> res = new HashMap<>();
        res.put("found", true);
        res.put("matchType", matchType);
        res.put("query", query);

        res.put("medicineId", med.getId());
        res.put("medicineName", med.getName());
        res.put("genericName", med.getGenericName());
        res.put("dosage", med.getDosage());
        res.put("unit", med.getUnit());
        res.put("price", med.getPrice());
        res.put("category", med.getCategory() != null ? med.getCategory().getName() : null);
        res.put("supplier", med.getSupplier() != null ? med.getSupplier().getName() : null);

        // Find active batches for FEFO (First Expiring, First Out)
        List<Batch> batches = batchRepository.findByMedicineId(med.getId());
        batches.sort(Comparator.comparing(Batch::getExpiryDate, Comparator.nullsLast(Comparator.naturalOrder())));

        List<Map<String, Object>> batchList = new ArrayList<>();
        int totalQty = 0;
        for (Batch b : batches) {
            if (Boolean.TRUE.equals(b.isActive())) {
                totalQty += (b.getQuantity() != null ? b.getQuantity() : 0);
                Map<String, Object> bItem = new HashMap<>();
                bItem.put("id", b.getId());
                bItem.put("batchNumber", b.getBatchNumber());
                bItem.put("quantity", b.getQuantity());
                bItem.put("expiryDate", b.getExpiryDate() != null ? b.getExpiryDate().toString() : null);
                batchList.add(bItem);
            }
        }

        res.put("totalStock", totalQty);
        res.put("batches", batchList);

        // FEFO recommended batch
        if (!batchList.isEmpty()) {
            res.put("recommendedBatch", batchList.get(0));
        }

        return res;
    }
}
