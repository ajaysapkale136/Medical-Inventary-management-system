package com.medistock.controller;

import com.medistock.dto.DashboardStats;
import com.medistock.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /** One endpoint feeds both the Admin and the Pharmacist dashboard. */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> stats() {
        return ResponseEntity.ok(dashboardService.build());
    }
}
