package com.v.medical.Service;

import com.v.medical.entity.OnlineOrder;
import com.v.medical.entity.OnlineOrderStatus;

import java.util.List;

public interface OnlineOrderService {

    List<OnlineOrder> getAllOrders();

    OnlineOrder getOrderById(Long id);

    OnlineOrder getOrderByNumber(
            String orderNumber);

    OnlineOrder createOrder(
            OnlineOrder order);

    OnlineOrder updateOrderStatus(
            Long id,
            OnlineOrderStatus status);

    OnlineOrder updatePaymentStatus(
            Long id,
            String paymentStatus);

    List<OnlineOrder> getOrdersByStatus(
            OnlineOrderStatus status);

    List<OnlineOrder> searchOrders(
            String customerName);

    List<OnlineOrder> searchByPlatform(
            String platformName);

    void deleteOrder(Long id);
}