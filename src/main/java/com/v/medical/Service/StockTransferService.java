package com.v.medical.Service;

import com.v.medical.entity.*;
import com.v.medical.repository.BatchRepository;
import com.v.medical.repository.InventoryRepository;
import com.v.medical.repository.MedicineRepository;
import com.v.medical.repository.StockLogRepository;
import com.v.medical.repository.StockTransferRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class StockTransferService {

    private final StockTransferRepository stockTransferRepository;
    private final MedicineRepository medicineRepository;
    private final BatchRepository batchRepository;
    private final InventoryRepository inventoryRepository;
    private final StockLogRepository stockLogRepository;
    private final AuditLogService auditLogService;

    public StockTransferService(
            StockTransferRepository stockTransferRepository,
            MedicineRepository medicineRepository,
            BatchRepository batchRepository,
            InventoryRepository inventoryRepository,
            StockLogRepository stockLogRepository,
            AuditLogService auditLogService) {
        this.stockTransferRepository = stockTransferRepository;
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
        this.inventoryRepository = inventoryRepository;
        this.stockLogRepository = stockLogRepository;
        this.auditLogService = auditLogService;
    }

    public List<StockTransfer> getAllTransfers() {
        return stockTransferRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<StockTransfer> getTransfersByStatus(TransferStatus status) {
        return stockTransferRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    public StockTransfer getById(Long id) {
        return stockTransferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock transfer not found with ID: " + id));
    }

    @Transactional
    public StockTransfer requestTransfer(
            Long medicineId,
            Long batchId,
            String fromLocation,
            String toLocation,
            Integer quantity,
            TransferUrgency urgency,
            String requestedBy,
            String notes) {

        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Transfer quantity must be greater than zero.");
        }

        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found: " + medicineId));

        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));

        String trfNumber = "TRF-" + (System.currentTimeMillis() % 1000000);

        StockTransfer transfer = new StockTransfer();
        transfer.setTransferNumber(trfNumber);
        transfer.setMedicine(medicine);
        transfer.setBatch(batch);
        transfer.setFromLocation(fromLocation != null ? fromLocation : "Central Pharmacy");
        transfer.setToLocation(toLocation != null ? toLocation : "Emergency Ward");
        transfer.setQuantity(quantity);
        transfer.setUrgency(urgency != null ? urgency : TransferUrgency.ROUTINE);
        transfer.setStatus(TransferStatus.REQUESTED);
        transfer.setRequestedBy(requestedBy != null ? requestedBy : "STAFF");
        transfer.setNotes(notes);

        StockTransfer saved = stockTransferRepository.save(transfer);

        auditLogService.record(
                requestedBy,
                "STAFF",
                null,
                AuditAction.WARD_TRANSFER_REQUEST,
                "StockTransfer",
                saved.getId().toString(),
                null,
                "Status: REQUESTED, Qty: " + quantity + " " + medicine.getName() + " -> " + transfer.getToLocation(),
                notes
        );

        return saved;
    }

    @Transactional
    public StockTransfer approveTransfer(Long id, String approvedBy) {
        StockTransfer transfer = getById(id);
        if (transfer.getStatus() != TransferStatus.REQUESTED) {
            throw new IllegalStateException("Only REQUESTED transfers can be approved. Current status: " + transfer.getStatus());
        }

        transfer.setStatus(TransferStatus.APPROVED);
        transfer.setApprovedBy(approvedBy != null ? approvedBy : "PHARMACIST");
        transfer.setUpdatedAt(LocalDateTime.now());
        StockTransfer saved = stockTransferRepository.save(transfer);

        auditLogService.record(
                approvedBy,
                "PHARMACIST",
                null,
                AuditAction.WARD_TRANSFER_APPROVE,
                "StockTransfer",
                saved.getId().toString(),
                "Status: REQUESTED",
                "Status: APPROVED",
                "Transfer approved for dispatch"
        );

        return saved;
    }

    @Transactional
    public StockTransfer dispatchTransfer(Long id, String dispatchedBy) {
        StockTransfer transfer = getById(id);
        if (transfer.getStatus() != TransferStatus.APPROVED) {
            throw new IllegalStateException("Only APPROVED transfers can be dispatched. Current status: " + transfer.getStatus());
        }

        // Deduct from source batch / inventory
        Batch batch = transfer.getBatch();
        int curBatchQty = batch.getQuantity() != null ? batch.getQuantity() : 0;
        if (curBatchQty < transfer.getQuantity()) {
            throw new IllegalStateException("Insufficient batch stock for dispatch. Available: " + curBatchQty + ", Required: " + transfer.getQuantity());
        }

        batch.setQuantity(curBatchQty - transfer.getQuantity());
        batchRepository.save(batch);

        inventoryRepository.findByBatchId(batch.getId()).ifPresent(inv -> {
            int curInv = inv.getQuantity() != null ? inv.getQuantity() : 0;
            inv.setQuantity(Math.max(0, curInv - transfer.getQuantity()));
            inv.setAvailableQuantity(Math.max(0, inv.getQuantity() - (inv.getReservedQuantity() != null ? inv.getReservedQuantity() : 0)));
            inventoryRepository.save(inv);

            StockLog log = new StockLog();
            log.setInventory(inv);
            log.setOperation(StockOperation.STOCK_OUT);
            log.setQuantity(transfer.getQuantity());
            log.setPreviousQuantity(curInv);
            log.setNewQuantity(inv.getQuantity());
            log.setReason("WARD_DISPATCH: To " + transfer.getToLocation() + " (" + transfer.getTransferNumber() + ")");
            log.setPerformedBy(dispatchedBy);
            stockLogRepository.save(log);
        });

        transfer.setStatus(TransferStatus.DISPATCHED);
        transfer.setDispatchedBy(dispatchedBy != null ? dispatchedBy : "PHARMACIST");
        transfer.setUpdatedAt(LocalDateTime.now());
        StockTransfer saved = stockTransferRepository.save(transfer);

        auditLogService.record(
                dispatchedBy,
                "PHARMACIST",
                null,
                AuditAction.WARD_TRANSFER_DISPATCH,
                "StockTransfer",
                saved.getId().toString(),
                "Status: APPROVED",
                "Status: DISPATCHED (-" + transfer.getQuantity() + " units deducted from " + transfer.getFromLocation() + ")",
                "Stock dispatched to transit"
        );

        return saved;
    }

    @Transactional
    public StockTransfer receiveTransfer(Long id, String receivedBy) {
        StockTransfer transfer = getById(id);
        if (transfer.getStatus() != TransferStatus.DISPATCHED) {
            throw new IllegalStateException("Only DISPATCHED transfers can be marked as received. Current status: " + transfer.getStatus());
        }

        // Add to destination inventory
        Optional<Inventory> destInvOpt = inventoryRepository.findByMedicineIdAndBatchId(
                transfer.getMedicine().getId(),
                transfer.getBatch().getId()
        );

        if (destInvOpt.isPresent()) {
            Inventory inv = destInvOpt.get();
            int prev = inv.getQuantity() != null ? inv.getQuantity() : 0;
            inv.setQuantity(prev + transfer.getQuantity());
            inv.setAvailableQuantity(inv.getQuantity() - (inv.getReservedQuantity() != null ? inv.getReservedQuantity() : 0));
            inventoryRepository.save(inv);

            StockLog log = new StockLog();
            log.setInventory(inv);
            log.setOperation(StockOperation.STOCK_IN);
            log.setQuantity(transfer.getQuantity());
            log.setPreviousQuantity(prev);
            log.setNewQuantity(inv.getQuantity());
            log.setReason("WARD_RECEIPT: From " + transfer.getFromLocation() + " (" + transfer.getTransferNumber() + ")");
            log.setPerformedBy(receivedBy);
            stockLogRepository.save(log);
        }

        transfer.setStatus(TransferStatus.RECEIVED);
        transfer.setReceivedBy(receivedBy != null ? receivedBy : "WARD_NURSE");
        transfer.setUpdatedAt(LocalDateTime.now());
        StockTransfer saved = stockTransferRepository.save(transfer);

        auditLogService.record(
                receivedBy,
                "STAFF",
                null,
                AuditAction.WARD_TRANSFER_RECEIVE,
                "StockTransfer",
                saved.getId().toString(),
                "Status: DISPATCHED",
                "Status: RECEIVED (+" + transfer.getQuantity() + " units confirmed at " + transfer.getToLocation() + ")",
                "Stock received and verified at destination ward"
        );

        return saved;
    }

    @Transactional
    public StockTransfer rejectTransfer(Long id, String rejectedBy, String reason) {
        StockTransfer transfer = getById(id);
        if (transfer.getStatus() == TransferStatus.DISPATCHED || transfer.getStatus() == TransferStatus.RECEIVED) {
            throw new IllegalStateException("Cannot reject a transfer that has already been dispatched or received.");
        }

        transfer.setStatus(TransferStatus.REJECTED);
        transfer.setNotes((transfer.getNotes() != null ? transfer.getNotes() + " | " : "") + "Rejected by " + rejectedBy + ": " + reason);
        transfer.setUpdatedAt(LocalDateTime.now());
        return stockTransferRepository.save(transfer);
    }

    public Map<String, Object> getTransferSummary() {
        List<StockTransfer> all = stockTransferRepository.findAllByOrderByCreatedAtDesc();
        long requested = all.stream().filter(t -> t.getStatus() == TransferStatus.REQUESTED).count();
        long approved = all.stream().filter(t -> t.getStatus() == TransferStatus.APPROVED).count();
        long dispatched = all.stream().filter(t -> t.getStatus() == TransferStatus.DISPATCHED).count();
        long received = all.stream().filter(t -> t.getStatus() == TransferStatus.RECEIVED).count();

        Map<String, Object> map = new HashMap<>();
        map.put("total", all.size());
        map.put("requested", requested);
        map.put("approved", approved);
        map.put("dispatched", dispatched);
        map.put("received", received);
        return map;
    }
}
