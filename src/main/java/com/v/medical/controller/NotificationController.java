package com.v.medical.controller;

import com.v.medical.entity.*;
import com.v.medical.Service.NotificationService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:3000")
public class NotificationController {

    private final NotificationService
            notificationService;

    public NotificationController(
            NotificationService notificationService) {

        this.notificationService =
                notificationService;
    }


    // ==========================================
    // ALL NOTIFICATIONS
    // ==========================================

    @GetMapping
    public ResponseEntity<List<Notification>>
    getAll() {

        return ResponseEntity.ok(
                notificationService
                        .getAllNotifications()
        );
    }


    // ==========================================
    // GET BY ID
    // ==========================================

    @GetMapping("/{id}")
    public ResponseEntity<Notification>
    getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                notificationService
                        .getNotificationById(id)
        );
    }


    // ==========================================
    // USER NOTIFICATIONS
    // ==========================================

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>>
    getUserNotifications(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                notificationService
                        .getUserNotifications(
                                userId
                        )
        );
    }


    // ==========================================
    // CREATE
    // ==========================================

    @PostMapping
    public ResponseEntity<Notification>
    create(
            @RequestBody Notification notification) {

        return ResponseEntity.ok(
                notificationService
                        .createNotification(
                                notification
                        )
        );
    }


    // ==========================================
    // SEARCH
    // ==========================================

    @GetMapping("/search")
    public ResponseEntity<List<Notification>>
    search(
            @RequestParam String keyword) {

        return ResponseEntity.ok(
                notificationService
                        .search(keyword)
        );
    }


    // ==========================================
    // FILTER TYPE
    // ==========================================

    @GetMapping("/type/{type}")
    public ResponseEntity<List<Notification>>
    byType(
            @PathVariable NotificationType type) {

        return ResponseEntity.ok(
                notificationService
                        .findByType(type)
        );
    }


    // ==========================================
    // FILTER PRIORITY
    // ==========================================

    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<Notification>>
    byPriority(
            @PathVariable NotificationPriority priority) {

        return ResponseEntity.ok(
                notificationService
                        .findByPriority(priority)
        );
    }


    // ==========================================
    // FILTER STATUS
    // ==========================================

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Notification>>
    byStatus(
            @PathVariable NotificationStatus status) {

        return ResponseEntity.ok(
                notificationService
                        .findByStatus(status)
        );
    }


    // ==========================================
    // UNREAD COUNT
    // ==========================================

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>>
    unreadCount() {

        long count =
                notificationService
                        .getUnreadCount();

        return ResponseEntity.ok(
                Map.of(
                        "unreadCount",
                        count
                )
        );
    }


    // ==========================================
    // USER UNREAD COUNT
    // ==========================================

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Map<String, Long>>
    userUnreadCount(
            @PathVariable Long userId) {

        long count =
                notificationService
                        .getUserUnreadCount(
                                userId
                        );

        return ResponseEntity.ok(
                Map.of(
                        "unreadCount",
                        count
                )
        );
    }


    // ==========================================
    // MARK READ
    // ==========================================

    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification>
    markRead(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                notificationService
                        .markAsRead(id)
        );
    }


    // ==========================================
    // MARK ALL READ
    // ==========================================

    @PatchMapping("/user/{userId}/read-all")
    public ResponseEntity<Void>
    markAllRead(
            @PathVariable Long userId) {

        notificationService
                .markAllAsRead(userId);

        return ResponseEntity.noContent()
                .build();
    }


    // ==========================================
    // ACKNOWLEDGE
    // ==========================================

    @PatchMapping("/{id}/acknowledge")
    public ResponseEntity<Notification>
    acknowledge(
            @PathVariable Long id,
            @RequestParam String by) {

        return ResponseEntity.ok(
                notificationService
                        .acknowledge(
                                id,
                                by
                        )
        );
    }


    // ==========================================
    // RESOLVE
    // ==========================================

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<Notification>
    resolve(
            @PathVariable Long id,
            @RequestParam String by) {

        return ResponseEntity.ok(
                notificationService
                        .resolve(
                                id,
                                by
                        )
        );
    }


    // ==========================================
    // DISMISS
    // ==========================================

    @PatchMapping("/{id}/dismiss")
    public ResponseEntity<Notification>
    dismiss(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                notificationService
                        .dismiss(id)
        );
    }


    // ==========================================
    // MEDICINE NOTIFICATIONS
    // ==========================================

    @GetMapping("/medicine/{medicineId}")
    public ResponseEntity<List<Notification>>
    medicineNotifications(
            @PathVariable Long medicineId) {

        return ResponseEntity.ok(
                notificationService
                        .getMedicineNotifications(
                                medicineId
                        )
        );
    }


    // ==========================================
    // BATCH NOTIFICATIONS
    // ==========================================

    @GetMapping("/batch/{batchId}")
    public ResponseEntity<List<Notification>>
    batchNotifications(
            @PathVariable Long batchId) {

        return ResponseEntity.ok(
                notificationService
                        .getBatchNotifications(
                                batchId
                        )
        );
    }


    // ==========================================
    // DELETE
    // ==========================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    delete(
            @PathVariable Long id) {

        notificationService
                .deleteNotification(id);

        return ResponseEntity.noContent()
                .build();
    }
}