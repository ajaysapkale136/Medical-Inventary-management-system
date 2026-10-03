package com.v.medical.controller;

import com.v.medical.entity.Category;
import com.v.medical.Service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(
            CategoryService categoryService) {

        this.categoryService = categoryService;
    }

    // GET ALL
    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {

        return ResponseEntity.ok(
                categoryService.getAllCategories()
        );
    }

    // GET ACTIVE
    @GetMapping("/active")
    public ResponseEntity<List<Category>> getActiveCategories() {

        return ResponseEntity.ok(
                categoryService.getActiveCategories()
        );
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                categoryService.getCategoryById(id)
        );
    }

    // SEARCH
    @GetMapping("/search")
    public ResponseEntity<List<Category>> searchCategories(
            @RequestParam String name) {

        return ResponseEntity.ok(
                categoryService.searchCategories(name)
        );
    }

    // CREATE
    @PostMapping
    public ResponseEntity<Category> createCategory(
            @RequestBody Category category) {

        return ResponseEntity.ok(
                categoryService.createCategory(category)
        );
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Category> updateCategory(
            @PathVariable Long id,
            @RequestBody Category category) {

        return ResponseEntity.ok(
                categoryService.updateCategory(
                        id,
                        category
                )
        );
    }

    // STATUS
    @PatchMapping("/{id}/status")
    public ResponseEntity<Category> updateStatus(
            @PathVariable Long id,
            @RequestParam boolean active) {

        return ResponseEntity.ok(
                categoryService.updateStatus(
                        id,
                        active
                )
        );
    }

    // SOFT DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id) {

        categoryService.deleteCategory(id);

        return ResponseEntity.noContent().build();
    }
}