package com.v.medical.controller;

import com.v.medical.Service.MedicineService;
import com.v.medical.entity.Medicine;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    private final MedicineService medicineService;

    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    @GetMapping
    public ResponseEntity<List<Medicine>> getAllMedicines() {
        return ResponseEntity.ok(medicineService.getAllMedicines());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Medicine> getMedicine(@PathVariable Long id) {
        return ResponseEntity.ok(medicineService.getMedicineById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Medicine>> search(@RequestParam String name) {
        return ResponseEntity.ok(medicineService.searchMedicines(name));
    }

    @PostMapping
    public ResponseEntity<Medicine> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(medicineService.createMedicine(
                toMedicine(body), getLong(body, "categoryId"), getLong(body, "supplierId")
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Medicine> update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(medicineService.updateMedicine(
                id, toMedicine(body), getLong(body, "categoryId"), getLong(body, "supplierId")
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        medicineService.deleteMedicine(id);
        return ResponseEntity.noContent().build();
    }

    private Medicine toMedicine(Map<String, Object> body) {
        Medicine medicine = new Medicine();
        medicine.setName(getString(body, "name"));
        medicine.setGenericName(getString(body, "genericName"));
        medicine.setDosage(getString(body, "dosage"));
        medicine.setUnit(getString(body, "unit"));
        medicine.setPrice(getDecimal(body, "price"));
        medicine.setReorderLevel(getInteger(body, "reorderLevel"));
        return medicine;
    }

    private String getString(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null || value.toString().isBlank() ? null : value.toString().trim();
    }

    private Long getLong(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null || value.toString().isBlank() ? null : Long.valueOf(value.toString());
    }

    private Integer getInteger(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null || value.toString().isBlank() ? null : Integer.valueOf(value.toString());
    }

    private BigDecimal getDecimal(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null || value.toString().isBlank() ? null : new BigDecimal(value.toString());
    }
}
