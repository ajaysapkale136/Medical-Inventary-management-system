package com.medistock.service;

import com.medistock.entity.Medicine;
import com.medistock.entity.Notification.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/** Runs every day at 08:00 and raises low-stock / expiry alerts. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AlertScheduler {

    private final MedicineService medicineService;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 8 * * *")
    public void dailyAlerts() {
        List<Medicine> low = medicineService.lowStock();
        List<Medicine> out = medicineService.outOfStock();
        List<Medicine> near = medicineService.nearExpiry();
        List<Medicine> expired = medicineService.expired();

        log.info("Daily alert job: low={} out={} nearExpiry={} expired={}",
                low.size(), out.size(), near.size(), expired.size());

        if (!low.isEmpty()) {
            notificationService.save(NotificationType.LOW_STOCK,
                    low.size() + " medicine(s) are running low on stock");
        }
        if (!out.isEmpty()) {
            notificationService.save(NotificationType.OUT_OF_STOCK,
                    out.size() + " medicine(s) are out of stock");
        }
        if (!near.isEmpty()) {
            notificationService.save(NotificationType.NEAR_EXPIRY,
                    near.size() + " medicine(s) expire within the next 30 days");
        }
        if (!expired.isEmpty()) {
            notificationService.save(NotificationType.EXPIRED,
                    expired.size() + " medicine(s) have already expired");
        }
    }
}
