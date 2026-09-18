package com.medistock.service;

import com.medistock.entity.Notification;
import com.medistock.entity.Notification.NotificationType;
import com.medistock.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Saves in-app notifications and (optionally) sends them by e-mail / SMS / push.
 * External providers stay disabled until you fill in the credentials in
 * application.properties, so the app runs fine out of the box.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final JavaMailSender mailSender;

    @Value("${medistock.mail.enabled:false}") private boolean mailEnabled;
    @Value("${medistock.mail.from:noreply@medistock.com}") private String mailFrom;
    @Value("${medistock.mail.admin:admin@medistock.com}") private String adminEmail;

    @Value("${medistock.twilio.enabled:false}") private boolean twilioEnabled;
    @Value("${medistock.twilio.account-sid:}") private String twilioSid;
    @Value("${medistock.twilio.auth-token:}") private String twilioToken;
    @Value("${medistock.twilio.from-number:}") private String twilioFrom;
    @Value("${medistock.twilio.to-number:}") private String twilioTo;

    @Value("${medistock.fcm.enabled:false}") private boolean fcmEnabled;

    public List<Notification> latest() {
        return notificationRepository.findTop50ByOrderByCreatedAtDesc();
    }

    public long unreadCount() {
        return notificationRepository.countByReadFlagFalse();
    }

    public void markAllRead() {
        List<Notification> all = notificationRepository.findAll();
        all.forEach(n -> n.setReadFlag(true));
        notificationRepository.saveAll(all);
    }

    public void system(String message) {
        save(NotificationType.SYSTEM, message);
    }

    /** Saves the notification and pushes it through every enabled channel. */
    public Notification save(NotificationType type, String message) {
        Notification saved = notificationRepository.save(
                Notification.builder().type(type).message(message).readFlag(false).build());

        sendEmail("MediStock alert: " + type, message);
        sendSms(message);
        sendPush("MediStock alert", message);
        return saved;
    }

    /* ---------------- E-mail (JavaMailSender) ---------------- */
    public void sendEmail(String subject, String body) {
        if (!mailEnabled) {
            log.info("[EMAIL disabled] {} - {}", subject, body);
            return;
        }
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(mailFrom);
            mail.setTo(adminEmail);
            mail.setSubject(subject);
            mail.setText(body);
            mailSender.send(mail);
        } catch (Exception ex) {
            log.error("Could not send e-mail: {}", ex.getMessage());
        }
    }

    public void sendEmailTo(String to, String subject, String body) {
        if (!mailEnabled) {
            log.info("[EMAIL disabled] to={} {} - {}", to, subject, body);
            return;
        }
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(mailFrom);
            mail.setTo(to);
            mail.setSubject(subject);
            mail.setText(body);
            mailSender.send(mail);
        } catch (Exception ex) {
            log.error("Could not send e-mail: {}", ex.getMessage());
        }
    }

    /* ---------------- SMS (Twilio) ---------------- */
    private void sendSms(String body) {
        if (!twilioEnabled) return;
        try {
            com.twilio.Twilio.init(twilioSid, twilioToken);
            com.twilio.rest.api.v2010.account.Message.creator(
                    new com.twilio.type.PhoneNumber(twilioTo),
                    new com.twilio.type.PhoneNumber(twilioFrom),
                    body).create();
        } catch (Exception ex) {
            log.error("Could not send SMS: {}", ex.getMessage());
        }
    }

    /* ---------------- Push (Firebase Cloud Messaging) ---------------- */
    private void sendPush(String title, String body) {
        if (!fcmEnabled) return;
        try {
            com.google.firebase.messaging.Message message = com.google.firebase.messaging.Message.builder()
                    .setTopic("medistock-alerts")
                    .setNotification(com.google.firebase.messaging.Notification.builder()
                            .setTitle(title).setBody(body).build())
                    .build();
            com.google.firebase.messaging.FirebaseMessaging.getInstance().send(message);
        } catch (Exception ex) {
            log.error("Could not send push notification: {}", ex.getMessage());
        }
    }
}
