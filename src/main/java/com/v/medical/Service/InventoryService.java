package com.v.medical.Service;

import com.v.medical.entity.Batch;
import com.v.medical.entity.Inventory;
import com.v.medical.entity.Medicine;
import com.v.medical.entity.StockLog;
import com.v.medical.entity.StockOperation;

import com.v.medical.repository.BatchRepository;
import com.v.medical.repository.InventoryRepository;
import com.v.medical.repository.MedicineRepository;
import com.v.medical.repository.StockLogRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    private final StockLogRepository stockLogRepository;

    private final MedicineRepository medicineRepository;

    private final BatchRepository batchRepository;

    public InventoryService(
            InventoryRepository inventoryRepository,
            StockLogRepository stockLogRepository,
            MedicineRepository medicineRepository,
            BatchRepository batchRepository) {

        this.inventoryRepository = inventoryRepository;
        this.stockLogRepository = stockLogRepository;
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
    }

    // ------------------------------------------------
    // GET ALL INVENTORY
    // ------------------------------------------------

    public List<Inventory> getAllInventory() {

        return inventoryRepository.findAll();
    }

    // ------------------------------------------------
    // GET ACTIVE INVENTORY
    // ------------------------------------------------

    public List<Inventory> getActiveInventory() {

        return inventoryRepository.findByActiveTrue();
    }

    // ------------------------------------------------
    // GET INVENTORY BY ID
    // ------------------------------------------------

    public Inventory getInventoryById(Long id) {

        return inventoryRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found with id: "
                                        + id
                        ));
    }

    // ------------------------------------------------
    // GET BY MEDICINE
    // ------------------------------------------------

    public Inventory getByMedicine(
            Long medicineId) {

        return inventoryRepository
                .findByMedicineId(medicineId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for medicine id: "
                                        + medicineId
                        ));
    }

    // ------------------------------------------------
    // GET BY BATCH
    // ------------------------------------------------

    public Inventory getByBatch(
            Long batchId) {

        return inventoryRepository
                .findByBatchId(batchId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for batch id: "
                                        + batchId
                        ));
    }

    // ------------------------------------------------
    // SEARCH
    // ------------------------------------------------

    public List<Inventory> search(
            String name) {

        return inventoryRepository
                .findByMedicine_NameContainingIgnoreCase(
                        name
                );
    }

    // ------------------------------------------------
    // LOW STOCK
    // ------------------------------------------------

    public List<Inventory> getLowStock() {

        return inventoryRepository
                .findByQuantityLessThanEqual(
                        10
                );
    }

    // ------------------------------------------------
    // OUT OF STOCK
    // ------------------------------------------------

    public List<Inventory> getOutOfStock() {

        return inventoryRepository
                .findByQuantity(0);
    }

    // ------------------------------------------------
    // CREATE INVENTORY
    // ------------------------------------------------

    @Transactional
    public Inventory createInventory(
            Long medicineId,
            Long batchId,
            Integer quantity,
            Integer reorderLevel,
            String location) {

        Medicine medicine =
                medicineRepository.findById(medicineId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Medicine not found"
                                ));

        Batch batch =
                batchRepository.findById(batchId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Batch not found"
                                ));

        if (quantity == null ||
                quantity < 0) {

            throw new RuntimeException(
                    "Quantity cannot be negative"
            );
        }

        if (reorderLevel == null ||
                reorderLevel < 0) {

            throw new RuntimeException(
                    "Reorder level cannot be negative"
            );
        }

        if (inventoryRepository
                .findByMedicineIdAndBatchId(
                        medicineId,
                        batchId
                )
                .isPresent()) {

            throw new RuntimeException(
                    "Inventory already exists for this medicine and batch"
            );
        }

        Inventory inventory =
                new Inventory();

        inventory.setMedicine(medicine);
        inventory.setBatch(batch);
        inventory.setQuantity(quantity);
        inventory.setReorderLevel(reorderLevel);
        inventory.setLocation(location);
        inventory.setActive(true);

        return inventoryRepository.save(
                inventory
        );
    }

    // ------------------------------------------------
    // STOCK IN
    // ------------------------------------------------

    @Transactional
    public Inventory stockIn(
            Long inventoryId,
            Integer quantity,
            String reason,
            String referenceNumber,
            String performedBy) {

        validateQuantity(quantity);

        Inventory inventory =
                getInventoryById(inventoryId);

        int previous =
                inventory.getQuantity();

        int updated =
                previous + quantity;

        inventory.setQuantity(updated);

        Inventory saved =
                inventoryRepository.save(
                        inventory
                );

        createStockLog(
                saved,
                StockOperation.STOCK_IN,
                quantity,
                previous,
                updated,
                reason,
                referenceNumber,
                performedBy
        );

        return saved;
    }

    // ------------------------------------------------
    // STOCK OUT
    // ------------------------------------------------

    @Transactional
    public Inventory stockOut(
            Long inventoryId,
            Integer quantity,
            String reason,
            String referenceNumber,
            String performedBy) {

        validateQuantity(quantity);

        Inventory inventory =
                getInventoryById(inventoryId);

        int previous =
                inventory.getQuantity();

        if (quantity > previous) {

            throw new RuntimeException(
                    "Insufficient stock. Available stock: "
                            + previous
            );
        }

        int updated =
                previous - quantity;

        inventory.setQuantity(updated);

        Inventory saved =
                inventoryRepository.save(
                        inventory
                );

        createStockLog(
                saved,
                StockOperation.STOCK_OUT,
                quantity,
                previous,
                updated,
                reason,
                referenceNumber,
                performedBy
        );

        return saved;
    }

    // ------------------------------------------------
    // STOCK ADJUSTMENT
    // ------------------------------------------------

    @Transactional
    public Inventory adjustment(
            Long inventoryId,
            Integer newQuantity,
            String reason,
            String performedBy) {

        if (newQuantity == null ||
                newQuantity < 0) {

            throw new RuntimeException(
                    "New quantity cannot be negative"
            );
        }

        Inventory inventory =
                getInventoryById(inventoryId);

        int previous =
                inventory.getQuantity();

        inventory.setQuantity(
                newQuantity
        );

        Inventory saved =
                inventoryRepository.save(
                        inventory
                );

        createStockLog(
                saved,
                StockOperation.ADJUSTMENT,
                Math.abs(
                        newQuantity - previous
                ),
                previous,
                newQuantity,
                reason,
                null,
                performedBy
        );

        return saved;
    }

    // ------------------------------------------------
    // TRANSFER OUT
    // ------------------------------------------------

    @Transactional
    public Inventory transferOut(
            Long inventoryId,
            Integer quantity,
            String destination,
            String performedBy) {

        validateQuantity(quantity);

        Inventory inventory =
                getInventoryById(inventoryId);

        int previous =
                inventory.getQuantity();

        if (quantity > previous) {

            throw new RuntimeException(
                    "Insufficient stock for transfer"
            );
        }

        int updated =
                previous - quantity;

        inventory.setQuantity(updated);

        Inventory saved =
                inventoryRepository.save(
                        inventory
                );

        createStockLog(
                saved,
                StockOperation.TRANSFER_OUT,
                quantity,
                previous,
                updated,
                "Transfer to: " + destination,
                null,
                performedBy
        );

        return saved;
    }

    // ------------------------------------------------
    // RETURN
    // ------------------------------------------------

    @Transactional
    public Inventory returnStock(
            Long inventoryId,
            Integer quantity,
            String reason,
            String performedBy) {

        validateQuantity(quantity);

        Inventory inventory =
                getInventoryById(inventoryId);

        int previous =
                inventory.getQuantity();

        int updated =
                previous + quantity;

        inventory.setQuantity(updated);

        Inventory saved =
                inventoryRepository.save(
                        inventory
                );

        createStockLog(
                saved,
                StockOperation.RETURN,
                quantity,
                previous,
                updated,
                reason,
                null,
                performedBy
        );

        return saved;
    }

    // ------------------------------------------------
    // STOCK HISTORY
    // ------------------------------------------------

    public List<StockLog> getHistory(
            Long inventoryId) {

        return stockLogRepository
                .findByInventoryIdOrderByCreatedAtDesc(
                        inventoryId
                );
    }

    // ------------------------------------------------
    // ALL STOCK HISTORY
    // ------------------------------------------------

    public List<StockLog> getAllHistory() {

        return stockLogRepository
                .findAllByOrderByCreatedAtDesc();
    }

    // ------------------------------------------------
    // UPDATE REORDER LEVEL
    // ------------------------------------------------

    @Transactional
    public Inventory updateReorderLevel(
            Long inventoryId,
            Integer reorderLevel) {

        if (reorderLevel == null ||
                reorderLevel < 0) {

            throw new RuntimeException(
                    "Invalid reorder level"
            );
        }

        Inventory inventory =
                getInventoryById(inventoryId);

        inventory.setReorderLevel(
                reorderLevel
        );

        return inventoryRepository.save(
                inventory
        );
    }

    // ------------------------------------------------
    // UPDATE LOCATION
    // ------------------------------------------------

    @Transactional
    public Inventory updateLocation(
            Long inventoryId,
            String location) {

        Inventory inventory =
                getInventoryById(inventoryId);

        inventory.setLocation(
                location
        );

        return inventoryRepository.save(
                inventory
        );
    }

    // ------------------------------------------------
    // STOCK LOG CREATOR
    // ------------------------------------------------

    private void createStockLog(
            Inventory inventory,
            StockOperation operation,
            Integer quantity,
            Integer previousQuantity,
            Integer newQuantity,
            String reason,
            String referenceNumber,
            String performedBy) {

        StockLog log =
                new StockLog();

        log.setInventory(
                inventory
        );

        log.setOperation(
                operation
        );

        log.setQuantity(
                quantity
        );

        log.setPreviousQuantity(
                previousQuantity
        );

        log.setNewQuantity(
                newQuantity
        );

        log.setReason(
                reason
        );

        log.setReferenceNumber(
                referenceNumber
        );

        log.setPerformedBy(
                performedBy
        );

        stockLogRepository.save(
                log
        );
    }

    // ------------------------------------------------
    // VALIDATE QUANTITY
    // ------------------------------------------------

    private void validateQuantity(
            Integer quantity) {

        if (quantity == null ||
                quantity <= 0) {

            throw new RuntimeException(
                    "Quantity must be greater than zero"
            );
        }
    }

}