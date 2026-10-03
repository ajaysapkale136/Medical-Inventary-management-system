package com.v.medical.repository;

import com.v.medical.entity.OnlineOrder;
import com.v.medical.entity.OnlineOrderStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OnlineOrderRepository
        extends JpaRepository<OnlineOrder, Long> {

    Optional<OnlineOrder>
    findByOrderNumber(String orderNumber);

    List<OnlineOrder>
    findAllByOrderByOrderDateDesc();

    List<OnlineOrder>
    findByStatusOrderByOrderDateDesc(
            OnlineOrderStatus status
    );

    List<OnlineOrder>
    findByCustomerNameContainingIgnoreCaseOrderByOrderDateDesc(
            String customerName
    );

    List<OnlineOrder>
    findByCustomerPhoneContainingOrderByOrderDateDesc(
            String phone
    );

    List<OnlineOrder>
    findByPlatformNameContainingIgnoreCaseOrderByOrderDateDesc(
            String platformName
    );

    List<OnlineOrder>
    findByOrderDateBetweenOrderByOrderDateDesc(
            LocalDateTime from,
            LocalDateTime to
    );
}