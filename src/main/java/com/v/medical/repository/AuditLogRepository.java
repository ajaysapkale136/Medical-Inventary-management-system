package com.v.medical.repository;

import com.v.medical.entity.AuditAction;
import com.v.medical.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findTop100ByOrderByTimestampDesc();

    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    List<AuditLog> findByEntityNameOrderByTimestampDesc(String entityName);

    List<AuditLog> findByActionOrderByTimestampDesc(AuditAction action);

    List<AuditLog> findByActorContainingIgnoreCaseOrderByTimestampDesc(String actor);

    List<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end);
}
