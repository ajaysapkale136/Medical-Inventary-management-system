package com.v.medical.repository;

import com.v.medical.entity.StockLog;
import com.v.medical.entity.StockOperation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface StockLogRepository
        extends JpaRepository<StockLog, Long> {

    List<StockLog>
    findByInventoryIdOrderByCreatedAtDesc(
            Long inventoryId
    );

    List<StockLog>
    findByOperationOrderByCreatedAtDesc(
            StockOperation operation
    );

    List<StockLog>
    findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime start,
            LocalDateTime end
    );

    List<StockLog>
    findAllByOrderByCreatedAtDesc();
}