package com.v.medical.Service;

import com.v.medical.entity.Batch;
import com.v.medical.entity.Medicine;
import com.v.medical.repository.BatchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ExpiryAlertService {

    private static final Logger log = LoggerFactory.getLogger(ExpiryAlertService.class);

    private final BatchRepository batchRepository;

    public ExpiryAlertService(BatchRepository batchRepository) {
        this.batchRepository = batchRepository;
    }

    /**
     * Daily scheduled health check for batch expiry warnings at 08:00 AM.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void scheduledExpiryAudit() {
        Map<String, Object> summary = getExpiryAlertSummary();
        int expired = (int) summary.get("expiredCount");
        int critical = (int) summary.get("criticalCount");
        if (expired > 0 || critical > 0) {
            log.warn("🚨 PHARMACY EXPIRY ALERT: {} batches EXPIRED, {} batches CRITICAL (<30 days remaining)!", expired, critical);
        } else {
            log.info("Batch expiry audit passed: No immediate critical expirations.");
        }
    }

    public Map<String, Object> getExpiryAlertSummary() {
        LocalDate today = LocalDate.now();
        List<Batch> activeBatches = batchRepository.findByActiveTrue();

        List<Map<String, Object>> alerts = new ArrayList<>();
        int expiredCount = 0;
        int criticalCount = 0;   // < 30 days
        int warningCount = 0;    // 30 - 60 days
        int watchlistCount = 0;  // 60 - 90 days

        for (Batch batch : activeBatches) {
            LocalDate exp = batch.getExpiryDate();
            if (exp == null) continue;

            long daysRemaining = ChronoUnit.DAYS.between(today, exp);
            String severity = null;

            if (daysRemaining < 0) {
                severity = "EXPIRED";
                expiredCount++;
            } else if (daysRemaining <= 30) {
                severity = "CRITICAL";
                criticalCount++;
            } else if (daysRemaining <= 60) {
                severity = "WARNING";
                warningCount++;
            } else if (daysRemaining <= 90) {
                severity = "WATCHLIST";
                watchlistCount++;
            }

            if (severity != null) {
                Medicine med = batch.getMedicine();
                Map<String, Object> item = new HashMap<>();
                item.put("batchId", batch.getId());
                item.put("batchNumber", batch.getBatchNumber());
                item.put("medicineId", med != null ? med.getId() : null);
                item.put("medicineName", med != null ? med.getName() : "Unknown");
                item.put("expiryDate", exp.toString());
                item.put("daysRemaining", daysRemaining);
                item.put("quantity", batch.getQuantity());
                item.put("severity", severity);
                alerts.add(item);
            }
        }

        // Sort by days remaining ascending (expired first)
        alerts.sort(Comparator.comparingLong(a -> (long) a.get("daysRemaining")));

        Map<String, Object> response = new HashMap<>();
        response.put("today", today.toString());
        response.put("totalBatchesAudited", activeBatches.size());
        response.put("expiredCount", expiredCount);
        response.put("criticalCount", criticalCount);
        response.put("warningCount", warningCount);
        response.put("watchlistCount", watchlistCount);
        response.put("totalAlerts", alerts.size());
        response.put("alerts", alerts);

        return response;
    }
}
