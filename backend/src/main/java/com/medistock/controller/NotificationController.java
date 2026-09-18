package com.medistock.controller;

import com.medistock.dto.ApiMessage;
import com.medistock.entity.Notification;
import com.medistock.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> list() {
        return ResponseEntity.ok(notificationService.latest());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> unreadCount() {
        return ResponseEntity.ok(notificationService.unreadCount());
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiMessage> readAll() {
        notificationService.markAllRead();
        return ResponseEntity.ok(new ApiMessage("All notifications marked as read"));
    }
}
