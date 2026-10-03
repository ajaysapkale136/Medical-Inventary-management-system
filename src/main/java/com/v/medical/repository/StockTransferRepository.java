package com.v.medical.repository;

import com.v.medical.entity.StockTransfer;
import com.v.medical.entity.TransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockTransferRepository extends JpaRepository<StockTransfer, Long> {

    List<StockTransfer> findAllByOrderByCreatedAtDesc();

    List<StockTransfer> findByStatusOrderByCreatedAtDesc(TransferStatus status);

    List<StockTransfer> findByFromLocationOrderByCreatedAtDesc(String fromLocation);

    List<StockTransfer> findByToLocationOrderByCreatedAtDesc(String toLocation);

    Optional<StockTransfer> findByTransferNumber(String transferNumber);

    boolean existsByTransferNumber(String transferNumber);
}
