package com.v.medical.controller;

import com.v.medical.Service.AuditLogService;
import com.v.medical.entity.AuditAction;
import com.v.medical.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/admin/audit-logs")
@CrossOrigin(origins = "http://localhost:3000")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> getLogs(
            @RequestParam(required = false) String entityName,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String actor,
            @RequestParam(defaultValue = "100") int limit) {

        if (action != null && !action.trim().isEmpty() && !action.equalsIgnoreCase("ALL")) {
            try {
                AuditAction auditAction = AuditAction.valueOf(action.toUpperCase());
                return ResponseEntity.ok(auditLogService.getByAction(auditAction));
            } catch (IllegalArgumentException ignored) {}
        }

        if (entityName != null && !entityName.trim().isEmpty() && !entityName.equalsIgnoreCase("ALL")) {
            return ResponseEntity.ok(auditLogService.getByEntity(entityName));
        }

        if (actor != null && !actor.trim().isEmpty()) {
            return ResponseEntity.ok(auditLogService.searchByActor(actor));
        }

        return ResponseEntity.ok(auditLogService.getRecentLogs(limit));
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<AuditLog>> getPagedLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(auditLogService.getPagedLogs(page, size));
    }

    @GetMapping("/actions")
    public ResponseEntity<AuditAction[]> getAuditActions() {
        return ResponseEntity.ok(AuditAction.values());
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAuditCsv() {
        List<AuditLog> logs = auditLogService.getRecentLogs(500);
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Timestamp,Actor,Role,IP Address,Action,Entity,Entity ID,Old Value,New Value,Reason\n");

        for (AuditLog l : logs) {
            sb.append(l.getId()).append(",");
            sb.append('"').append(l.getTimestamp()).append("\",");
            sb.append('"').append(l.getActor() != null ? l.getActor().replace("\"", "\"\"") : "").append("\",");
            sb.append('"').append(l.getRole() != null ? l.getRole() : "").append("\",");
            sb.append('"').append(l.getIpAddress() != null ? l.getIpAddress() : "").append("\",");
            sb.append(l.getAction()).append(",");
            sb.append('"').append(l.getEntityName() != null ? l.getEntityName() : "").append("\",");
            sb.append('"').append(l.getEntityId() != null ? l.getEntityId() : "").append("\",");
            sb.append('"').append(l.getOldValue() != null ? l.getOldValue().replace("\"", "\"\"") : "").append("\",");
            sb.append('"').append(l.getNewValue() != null ? l.getNewValue().replace("\"", "\"\"") : "").append("\",");
            sb.append('"').append(l.getReason() != null ? l.getReason().replace("\"", "\"\"") : "").append("\"\n");
        }

        byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Medistock_GxP_Audit_Trail.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }
}
