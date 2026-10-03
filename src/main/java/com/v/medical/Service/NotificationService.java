package com.v.medical.Service;

import com.v.medical.entity.*;
import com.v.medical.repository.NotificationRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository
            notificationRepository;

    public NotificationService(
            NotificationRepository notificationRepository) {

        this.notificationRepository =
                notificationRepository;
    }


    // ==========================================
    // GET ALL
    // ==========================================

    public List<Notification> getAllNotifications() {

        return notificationRepository.findAll();
    }


    // ==========================================
    // GET BY ID
    // ==========================================

    public Notification getNotificationById(
            Long id) {

        return notificationRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Notification not found: "
                                        + id
                        ));
    }


    // ==========================================
    // USER NOTIFICATIONS
    // ==========================================

    public List<Notification>
    getUserNotifications(Long userId) {

        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(
                        userId
                );
    }


    // ==========================================
    // CREATE
    // ==========================================

    @Transactional
    public Notification createNotification(
            Notification notification) {

        if (notification.getTitle() == null ||
                notification.getTitle()
                        .isBlank()) {

            throw new RuntimeException(
                    "Notification title is required"
            );
        }

        if (notification.getMessage() == null ||
                notification.getMessage()
                        .isBlank()) {

            throw new RuntimeException(
                    "Notification message is required"
            );
        }

        if (notification.getType() == null) {

            notification.setType(
                    NotificationType.SYSTEM
            );
        }

        if (notification.getPriority() == null) {

            notification.setPriority(
                    NotificationPriority.INFO
            );
        }

        if (notification.getStatus() == null) {

            notification.setStatus(
                    NotificationStatus.NEW
            );
        }

        if (notification.getChannel() == null) {

            notification.setChannel(
                    NotificationChannel.IN_APP
            );
        }

        return notificationRepository.save(
                notification
        );
    }


    // ==========================================
    // MARK AS READ
    // ==========================================

    @Transactional
    public Notification markAsRead(
            Long id) {

        Notification notification =
                getNotificationById(id);

        notification.setStatus(
                NotificationStatus.READ
        );

        notificationRepository.save(
                notification
        );

        return notification;
    }


    // ==========================================
    // MARK ALL AS READ FOR USER
    // ==========================================

    @Transactional
    public void markAllAsRead(
            Long userId) {

        List<Notification> notifications =
                notificationRepository
                        .findByUserIdAndStatusOrderByCreatedAtDesc(
                                userId,
                                NotificationStatus.NEW
                        );

        for (Notification notification :
                notifications) {

            notification.setStatus(
                    NotificationStatus.READ
            );
        }

        notificationRepository.saveAll(
                notifications
        );
    }


    // ==========================================
    // ACKNOWLEDGE
    // ==========================================

    @Transactional
    public Notification acknowledge(
            Long id,
            String acknowledgedBy) {

        Notification notification =
                getNotificationById(id);

        notification.setStatus(
                NotificationStatus.ACKNOWLEDGED
        );

        notification.setAcknowledgedAt(
                LocalDateTime.now()
        );

        notification.setAcknowledgedBy(
                acknowledgedBy
        );

        return notificationRepository.save(
                notification
        );
    }


    // ==========================================
    // RESOLVE
    // ==========================================

    @Transactional
    public Notification resolve(
            Long id,
            String resolvedBy) {

        Notification notification =
                getNotificationById(id);

        notification.setStatus(
                NotificationStatus.RESOLVED
        );

        notification.setResolvedAt(
                LocalDateTime.now()
        );

        notification.setResolvedBy(
                resolvedBy
        );

        return notificationRepository.save(
                notification
        );
    }


    // ==========================================
    // DISMISS
    // ==========================================

    @Transactional
    public Notification dismiss(
            Long id) {

        Notification notification =
                getNotificationById(id);

        notification.setStatus(
                NotificationStatus.DISMISSED
        );

        return notificationRepository.save(
                notification
        );
    }


    // ==========================================
    // SEARCH
    // ==========================================

    public List<Notification> search(
            String keyword) {

        return notificationRepository
                .findByTitleContainingIgnoreCaseOrMessageContainingIgnoreCase(
                        keyword,
                        keyword
                );
    }


    // ==========================================
    // FILTER BY TYPE
    // ==========================================

    public List<Notification> findByType(
            NotificationType type) {

        return notificationRepository
                .findByType(type);
    }


    // ==========================================
    // FILTER BY PRIORITY
    // ==========================================

    public List<Notification> findByPriority(
            NotificationPriority priority) {

        return notificationRepository
                .findByPriority(priority);
    }


    // ==========================================
    // FILTER BY STATUS
    // ==========================================

    public List<Notification> findByStatus(
            NotificationStatus status) {

        return notificationRepository
                .findByStatus(status);
    }


    // ==========================================
    // UNREAD COUNT
    // ==========================================

    public long getUnreadCount() {

        return notificationRepository
                .countByStatus(
                        NotificationStatus.NEW
                );
    }


    // ==========================================
    // USER UNREAD COUNT
    // ==========================================

    public long getUserUnreadCount(
            Long userId) {

        return notificationRepository
                .countByUserIdAndStatus(
                        userId,
                        NotificationStatus.NEW
                );
    }


    // ==========================================
    // MEDICINE NOTIFICATIONS
    // ==========================================

    public List<Notification>
    getMedicineNotifications(
            Long medicineId) {

        return notificationRepository
                .findByMedicineId(
                        medicineId
                );
    }


    // ==========================================
    // BATCH NOTIFICATIONS
    // ==========================================

    public List<Notification>
    getBatchNotifications(
            Long batchId) {

        return notificationRepository
                .findByBatchId(
                        batchId
                );
    }


    // ==========================================
    // DELETE
    // ==========================================

    @Transactional
    public void deleteNotification(
            Long id) {

        Notification notification =
                getNotificationById(id);

        notificationRepository.delete(
                notification
        );
    }
}