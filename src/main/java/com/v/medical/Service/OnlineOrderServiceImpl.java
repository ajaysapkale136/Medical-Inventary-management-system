package com.v.medical.Service;

import com.v.medical.entity.*;
import com.v.medical.repository.OnlineOrderRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class OnlineOrderServiceImpl
        implements OnlineOrderService {

    private final OnlineOrderRepository orderRepository;

    public OnlineOrderServiceImpl(
            OnlineOrderRepository orderRepository) {

        this.orderRepository =
                orderRepository;
    }

    // ==========================================
    // GET ALL
    // ==========================================

    @Override
    public List<OnlineOrder> getAllOrders() {

        return orderRepository
                .findAllByOrderByOrderDateDesc();
    }

    // ==========================================
    // GET BY ID
    // ==========================================

    @Override
    public OnlineOrder getOrderById(
            Long id) {

        return orderRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Online order not found: "
                                        + id
                        ));
    }

    // ==========================================
    // GET BY ORDER NUMBER
    // ==========================================

    @Override
    public OnlineOrder getOrderByNumber(
            String orderNumber) {

        return orderRepository
                .findByOrderNumber(
                        orderNumber
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Order not found: "
                                        + orderNumber
                        ));
    }

    // ==========================================
    // CREATE ORDER
    // ==========================================

    @Override
    @Transactional
    public OnlineOrder createOrder(
            OnlineOrder order) {

        if (order.getCustomerName() == null ||
                order.getCustomerName().isBlank()) {

            throw new RuntimeException(
                    "Customer name is required"
            );
        }

        if (order.getCustomerPhone() == null ||
                order.getCustomerPhone().isBlank()) {

            throw new RuntimeException(
                    "Customer phone is required"
            );
        }

        if (order.getItems() == null ||
                order.getItems().isEmpty()) {

            throw new RuntimeException(
                    "Order must contain at least one medicine"
            );
        }

        // ======================================
        // ORDER NUMBER
        // ======================================

        if (order.getOrderNumber() == null ||
                order.getOrderNumber().isBlank()) {

            order.setOrderNumber(
                    generateOrderNumber()
            );
        }

        // ======================================
        // DEFAULT VALUES
        // ======================================

        if (order.getDiscount() == null) {

            order.setDiscount(
                    BigDecimal.ZERO
            );
        }

        if (order.getTax() == null) {

            order.setTax(
                    BigDecimal.ZERO
            );
        }

        if (order.getDeliveryCharge() == null) {

            order.setDeliveryCharge(
                    BigDecimal.ZERO
            );
        }

        // ======================================
        // CALCULATE TOTAL
        // ======================================

        BigDecimal subtotal =
                BigDecimal.ZERO;

        for (OnlineOrderItem item :
                order.getItems()) {

            if (item.getQuantity() == null ||
                    item.getQuantity() <= 0) {

                throw new RuntimeException(
                        "Invalid medicine quantity"
                );
            }

            if (item.getUnitPrice() == null) {

                throw new RuntimeException(
                        "Medicine price is required"
                );
            }

            BigDecimal itemTotal =
                    item.getUnitPrice()
                            .multiply(
                                    BigDecimal.valueOf(
                                            item.getQuantity()
                                    )
                            );

            item.setTotalPrice(
                    itemTotal
            );

            if (item.getMedicine() != null &&
                    item.getMedicineName() == null) {

                item.setMedicineName(
                        item.getMedicine()
                                .getName()
                );
            }

            item.setOnlineOrder(order);

            subtotal =
                    subtotal.add(
                            itemTotal
                    );
        }

        order.setSubtotal(subtotal);

        BigDecimal total =
                subtotal
                        .subtract(
                                order.getDiscount()
                        )
                        .add(
                                order.getTax()
                        )
                        .add(
                                order.getDeliveryCharge()
                        );

        if (total.compareTo(
                BigDecimal.ZERO
        ) < 0) {

            total = BigDecimal.ZERO;
        }

        order.setTotalAmount(total);

        // ======================================
        // DEFAULT STATUS
        // ======================================

        if (order.getStatus() == null) {

            order.setStatus(
                    OnlineOrderStatus.PENDING
            );
        }

        if (order.getPaymentStatus() == null) {

            order.setPaymentStatus(
                    PaymentStatus.PENDING
            );
        }

        if (order.getOrderDate() == null) {

            order.setOrderDate(
                    LocalDateTime.now()
            );
        }

        return orderRepository.save(order);
    }

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    @Override
    @Transactional
    public OnlineOrder updateOrderStatus(
            Long id,
            OnlineOrderStatus status) {

        OnlineOrder order =
                getOrderById(id);

        order.setStatus(status);

        if (status ==
                OnlineOrderStatus.CONFIRMED) {

            order.setConfirmedAt(
                    LocalDateTime.now()
            );
        }

        if (status ==
                OnlineOrderStatus.DELIVERED) {

            order.setDeliveredAt(
                    LocalDateTime.now()
            );
        }

        if (status ==
                OnlineOrderStatus.CANCELLED) {

            order.setCancelledAt(
                    LocalDateTime.now()
            );
        }

        return orderRepository.save(order);
    }

    // ==========================================
    // PAYMENT STATUS
    // ==========================================

    @Override
    @Transactional
    public OnlineOrder updatePaymentStatus(
            Long id,
            String paymentStatus) {

        OnlineOrder order =
                getOrderById(id);

        try {

            PaymentStatus status =
                    PaymentStatus.valueOf(
                            paymentStatus
                                    .toUpperCase()
                    );

            order.setPaymentStatus(status);

        } catch (IllegalArgumentException e) {

            throw new RuntimeException(
                    "Invalid payment status: "
                            + paymentStatus
            );
        }

        return orderRepository.save(order);
    }

    // ==========================================
    // STATUS FILTER
    // ==========================================

    @Override
    public List<OnlineOrder>
    getOrdersByStatus(
            OnlineOrderStatus status) {

        return orderRepository
                .findByStatusOrderByOrderDateDesc(
                        status
                );
    }

    // ==========================================
    // CUSTOMER SEARCH
    // ==========================================

    @Override
    public List<OnlineOrder>
    searchOrders(
            String customerName) {

        return orderRepository
                .findByCustomerNameContainingIgnoreCaseOrderByOrderDateDesc(
                        customerName
                );
    }

    // ==========================================
    // PLATFORM SEARCH
    // ==========================================

    @Override
    public List<OnlineOrder>
    searchByPlatform(
            String platformName) {

        return orderRepository
                .findByPlatformNameContainingIgnoreCaseOrderByOrderDateDesc(
                        platformName
                );
    }

    // ==========================================
    // DELETE
    // ==========================================

    @Override
    @Transactional
    public void deleteOrder(Long id) {

        OnlineOrder order =
                getOrderById(id);

        orderRepository.delete(order);
    }

    // ==========================================
    // ORDER NUMBER
    // ==========================================

    private String generateOrderNumber() {

        return "ORD-"
                + System.currentTimeMillis()
                + "-"
                + UUID.randomUUID()
                        .toString()
                        .substring(0, 4)
                        .toUpperCase();
    }
}