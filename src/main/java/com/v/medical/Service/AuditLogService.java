package com.v.medical.Service;

import com.v.medical.entity.AuditAction;
import com.v.medical.entity.AuditLog;
import com.v.medical.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Record an immutable audit log entry.
     * Uses REQUIRES_NEW propagation to ensure audit trail is preserved even if the parent business transaction fails.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog record(
            String actor,
            String role,
            String ipAddress,
            AuditAction action,
            String entityName,
            String entityId,
            String oldValue,
            String newValue,
            String reason) {

        try {
            AuditLog audit = new AuditLog(actor, role, ipAddress, action, entityName, entityId, oldValue, newValue, reason);
            AuditLog saved = auditLogRepository.save(audit);
            log.info("GxP AUDIT LOG [{}]: Actor={}, Action={}, Entity={}:{}",
                    saved.getId(), actor, action, entityName, entityId);
            return saved;
        } catch (Exception e) {
            log.error("Failed to persist audit log: {}", e.getMessage(), e);
            return null;
        }
    }

    public List<AuditLog> getRecentLogs(int limit) {
        return auditLogRepository.findTop100ByOrderByTimestampDesc();
    }

    public Page<AuditLog> getPagedLogs(int page, int size) {
        return auditLogRepository.findAllByOrderByTimestampDesc(PageRequest.of(page, size));
    }

    public List<AuditLog> getByEntity(String entityName) {
        return auditLogRepository.findByEntityNameOrderByTimestampDesc(entityName);
    }

    public List<AuditLog> getByAction(AuditAction action) {
        return auditLogRepository.findByActionOrderByTimestampDesc(action);
    }

    public List<AuditLog> searchByActor(String actor) {
        return auditLogRepository.findByActorContainingIgnoreCaseOrderByTimestampDesc(actor);
    }
}
