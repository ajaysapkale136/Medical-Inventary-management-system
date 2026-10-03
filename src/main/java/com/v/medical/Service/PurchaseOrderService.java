package com.v.medical.Service;

import com.v.medical.entity.*;
import com.v.medical.repository.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository
            purchaseOrderRepository;

    private final PurchaseOrderItemRepository
            itemRepository;

    private final SupplierRepository
            supplierRepository;

    private final MedicineRepository
            medicineRepository;

    private final BatchRepository
            batchRepository;

    private final InventoryRepository
            inventoryRepository;

    private final StockLogRepository
            stockLogRepository;

    public PurchaseOrderService(
            PurchaseOrderRepository purchaseOrderRepository,
            PurchaseOrderItemRepository itemRepository,
            SupplierRepository supplierRepository,
            MedicineRepository medicineRepository,
            BatchRepository batchRepository,
            InventoryRepository inventoryRepository,
            StockLogRepository stockLogRepository) {

        this.purchaseOrderRepository =
                purchaseOrderRepository;

        this.itemRepository =
                itemRepository;

        this.supplierRepository =
                supplierRepository;

        this.medicineRepository =
                medicineRepository;
        this.batchRepository =
                batchRepository;
        this.inventoryRepository =
                inventoryRepository;
        this.stockLogRepository =
                stockLogRepository;
    }

    public List<PurchaseOrder>
    getAllOrders() {

        return purchaseOrderRepository
                .findAllByOrderByCreatedAtDesc();
    }

    public PurchaseOrder
    getOrder(Long id) {

        return purchaseOrderRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Purchase order not found: "
                                        + id
                        ));
    }

    public List<PurchaseOrder>
    getBySupplier(Long supplierId) {

        return purchaseOrderRepository
                .findBySupplierId(supplierId);
    }

    public List<PurchaseOrder>
    getByStatus(
            PurchaseOrderStatus status) {

        return purchaseOrderRepository
                .findByStatus(status);
    }

    public List<PurchaseOrder>
    search(String keyword) {

        return purchaseOrderRepository
                .findByPoNumberContainingIgnoreCase(
                        keyword
                );
    }

    @Transactional
    public PurchaseOrder createOrder(
            Long supplierId,
            String poNumber,
            String createdBy) {

        if (purchaseOrderRepository
                .existsByPoNumber(poNumber)) {

            throw new RuntimeException(
                    "PO number already exists"
            );
        }

        Supplier supplier =
                supplierRepository
                        .findById(supplierId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Supplier not found"
                                ));

        PurchaseOrder order =
                new PurchaseOrder();

        order.setPoNumber(poNumber);
        order.setSupplier(supplier);
        order.setCreatedBy(createdBy);
        order.setStatus(
                PurchaseOrderStatus.DRAFT
        );

        return purchaseOrderRepository
                .save(order);
    }

    @Transactional
    public PurchaseOrder addItem(
            Long orderId,
            Long medicineId,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal tax,
            BigDecimal discount,
            String batchNumber) {

        if (quantity == null ||
                quantity <= 0) {

            throw new RuntimeException(
                    "Quantity must be greater than zero"
            );
        }

        if (unitPrice == null ||
                unitPrice.compareTo(
                        BigDecimal.ZERO
                ) < 0) {

            throw new RuntimeException(
                    "Invalid unit price"
            );
        }

        PurchaseOrder order =
                getOrder(orderId);

        Medicine medicine =
                medicineRepository
                        .findById(medicineId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Medicine not found"
                                ));

        PurchaseOrderItem item =
                new PurchaseOrderItem();

        item.setPurchaseOrder(order);
        item.setMedicine(medicine);
        item.setOrderedQuantity(quantity);
        item.setUnitPrice(unitPrice);
        item.setTax(
                tax == null
                        ? BigDecimal.ZERO
                        : tax
        );
        item.setDiscount(
                discount == null
                        ? BigDecimal.ZERO
                        : discount
        );
        item.setBatchNumber(
                batchNumber
        );

        BigDecimal base =
                unitPrice.multiply(
                        BigDecimal.valueOf(
                                quantity
                        )
                );

        BigDecimal itemTotal =
                base
                        .add(item.getTax())
                        .subtract(item.getDiscount());

        item.setTotalPrice(
                itemTotal
        );

        order.addItem(item);

        calculateTotals(order);

        return purchaseOrderRepository
                .save(order);
    }

    private void calculateTotals(
            PurchaseOrder order) {

        BigDecimal subtotal =
                BigDecimal.ZERO;

        BigDecimal tax =
                BigDecimal.ZERO;

        BigDecimal discount =
                BigDecimal.ZERO;

        for (PurchaseOrderItem item :
                order.getItems()) {

            BigDecimal base =
                    item.getUnitPrice()
                            .multiply(
                                    BigDecimal.valueOf(
                                            item.getOrderedQuantity()
                                    )
                            );

            subtotal =
                    subtotal.add(base);

            tax =
                    tax.add(
                            item.getTax()
                    );

            discount =
                    discount.add(
                            item.getDiscount()
                    );
        }

        BigDecimal total =
                subtotal
                        .add(tax)
                        .subtract(discount);

        order.setSubtotal(subtotal);
        order.setTax(tax);
        order.setDiscount(discount);
        order.setTotalAmount(total);
    }

    @Transactional
    public PurchaseOrder
    updateStatus(
            Long id,
            PurchaseOrderStatus status) {

        PurchaseOrder order =
                getOrder(id);

        if (order.getStatus() == PurchaseOrderStatus.RECEIVED
                && status == PurchaseOrderStatus.RECEIVED) {
            return order;
        }

        if (status == PurchaseOrderStatus.RECEIVED) {
            receiveIntoInventory(order);
        }

        order.setStatus(status);

        if (status ==
                PurchaseOrderStatus.RECEIVED) {

            order.setReceivingStatus(
                    "RECEIVED"
            );
        }

        if (status ==
                PurchaseOrderStatus.CANCELLED) {

            order.setReceivingStatus(
                    "CANCELLED"
            );
        }

        return purchaseOrderRepository
                .save(order);
    }

    private void receiveIntoInventory(PurchaseOrder order) {

        for (PurchaseOrderItem item : order.getItems()) {
            if (item.getBatchNumber() == null || item.getBatchNumber().isBlank()) {
                throw new RuntimeException(
                        "Each received purchase-order item needs a batch number"
                );
            }

            Batch batch = batchRepository.findByBatchNumber(item.getBatchNumber())
                    .orElseThrow(() -> new RuntimeException(
                            "Create batch " + item.getBatchNumber()
                                    + " with manufacturing and expiry dates before receiving this order"
                    ));

            if (!batch.getMedicine().getId().equals(item.getMedicine().getId())) {
                throw new RuntimeException(
                        "Batch " + item.getBatchNumber()
                                + " belongs to a different medicine"
                );
            }

            Inventory inventory = inventoryRepository
                    .findByMedicineIdAndBatchId(
                            item.getMedicine().getId(),
                            batch.getId()
                    )
                    .orElseGet(() -> {
                        Inventory created = new Inventory();
                        created.setMedicine(item.getMedicine());
                        created.setBatch(batch);
                        created.setQuantity(0);
                        created.setReorderLevel(item.getMedicine().getReorderLevel());
                        created.setLocation("Main Warehouse");
                        return inventoryRepository.save(created);
                    });

            int previousQuantity = inventory.getQuantity();
            int receivedQuantity = item.getOrderedQuantity();
            int newQuantity = previousQuantity + receivedQuantity;

            inventory.setQuantity(newQuantity);
            inventoryRepository.save(inventory);

            batch.setQuantity(batch.getQuantity() + receivedQuantity);
            batchRepository.save(batch);

            StockLog log = new StockLog();
            log.setInventory(inventory);
            log.setOperation(StockOperation.STOCK_IN);
            log.setQuantity(receivedQuantity);
            log.setPreviousQuantity(previousQuantity);
            log.setNewQuantity(newQuantity);
            log.setReason("Purchase order received");
            log.setReferenceNumber(order.getPoNumber());
            log.setPerformedBy(order.getCreatedBy());
            stockLogRepository.save(log);
        }
    }

    @Transactional
    public PurchaseOrder
    cancelOrder(Long id) {

        return updateStatus(
                id,
                PurchaseOrderStatus.CANCELLED
        );
    }

    public List<PurchaseOrderItem>
    getItems(Long orderId) {

        getOrder(orderId);

        return itemRepository
                .findByPurchaseOrderId(
                        orderId
                );
    }

    public void deleteOrder(Long id) {

        PurchaseOrder order =
                getOrder(id);

        if (order.getStatus() ==
                PurchaseOrderStatus.RECEIVED) {

            throw new RuntimeException(
                    "Received purchase orders cannot be deleted"
            );
        }

        purchaseOrderRepository
                .delete(order);
    }

    @Transactional
    public PurchaseOrder saveOrder(PurchaseOrder order) {
        return purchaseOrderRepository.save(order);
    }
}
