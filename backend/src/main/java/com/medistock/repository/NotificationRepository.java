package com.medistock.repository;

import com.medistock.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop50ByOrderByCreatedAtDesc();
    long countByReadFlagFalse();
}
