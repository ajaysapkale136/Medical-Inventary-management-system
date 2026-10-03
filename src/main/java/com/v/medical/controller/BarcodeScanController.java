package com.v.medical.controller;

import com.v.medical.Service.BarcodeScanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/medicines")
@CrossOrigin(origins = "http://localhost:3000")
public class BarcodeScanController {

    private final BarcodeScanService barcodeScanService;

    public BarcodeScanController(BarcodeScanService barcodeScanService) {
        this.barcodeScanService = barcodeScanService;
    }

    @GetMapping("/scan")
    public ResponseEntity<Map<String, Object>> scanByParam(@RequestParam(required = false, defaultValue = "") String code) {
        return ResponseEntity.ok(barcodeScanService.scan(code));
    }

    @GetMapping("/scan/{code}")
    public ResponseEntity<Map<String, Object>> scanByPath(@PathVariable String code) {
        return ResponseEntity.ok(barcodeScanService.scan(code));
    }
}
