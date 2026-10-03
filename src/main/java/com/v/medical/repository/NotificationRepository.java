package com.v.medical.repository;

import com.v.medical.entity.Notification;
import com.v.medical.entity.NotificationPriority;
import com.v.medical.entity.NotificationStatus;
import com.v.medical.entity.NotificationType;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    // ==============================
    // USER NOTIFICATIONS
    // ==============================

    List<Notification> findByUserIdOrderByCreatedAtDesc(
            Long userId
    );

    // ==============================
    // STATUS
    // ==============================

    List<Notification> findByStatus(
            NotificationStatus status
    );

    // ==============================
    // TYPE
    // ==============================

    List<Notification> findByType(
            NotificationType type
    );

    // ==============================
    // PRIORITY
    // ==============================

    List<Notification> findByPriority(
            NotificationPriority priority
    );

    // ==============================
    // USER + STATUS
    // ==============================

    List<Notification>
    findByUserIdAndStatusOrderByCreatedAtDesc(
            Long userId,
            NotificationStatus status
    );

    // ==============================
    // UNREAD COUNT
    // ==============================

    long countByStatus(
            NotificationStatus status
    );

    long countByUserIdAndStatus(
            Long userId,
            NotificationStatus status
    );

    // ==============================
    // SEARCH
    // ==============================

    List<Notification>
    findByTitleContainingIgnoreCaseOrMessageContainingIgnoreCase(
            String title,
            String message
    );

    // ==============================
    // MEDICINE
    // ==============================

    List<Notification> findByMedicineId(
            Long medicineId
    );

    // ==============================
    // BATCH
    // ==============================

    List<Notification> findByBatchId(
            Long batchId
    );
}