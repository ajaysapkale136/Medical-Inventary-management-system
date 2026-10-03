package com.v.medical.controller;

import com.v.medical.Service.UserPreferencesService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/preferences")
public class UserPreferencesController {

    private final UserPreferencesService preferencesService;

    public UserPreferencesController(UserPreferencesService preferencesService) {
        this.preferencesService = preferencesService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> get(HttpServletRequest request) {
        return ResponseEntity.ok(preferencesService.get(currentUserId(request)));
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> save(
            @RequestBody Map<String, Object> preferences,
            HttpServletRequest request) {
        return ResponseEntity.ok(preferencesService.save(currentUserId(request), preferences));
    }

    private Long currentUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in to continue");
        }
        return (Long) session.getAttribute("userId");
    }
}
