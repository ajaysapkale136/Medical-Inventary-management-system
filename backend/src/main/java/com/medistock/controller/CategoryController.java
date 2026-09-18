package com.medistock.controller;

import com.medistock.dto.ApiMessage;
import com.medistock.entity.Category;
import com.medistock.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<Category>> list() {
        return ResponseEntity.ok(categoryService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<Category> create(@Valid @RequestBody Category category) {
        return ResponseEntity.ok(categoryService.save(category));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<Category> update(@PathVariable Long id, @Valid @RequestBody Category category) {
        return ResponseEntity.ok(categoryService.update(id, category));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiMessage> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.ok(new ApiMessage("Category deleted"));
    }
}
