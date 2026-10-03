package com.v.medical.Service;

import com.v.medical.entity.Category;
import com.v.medical.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(
            CategoryRepository categoryRepository) {

        this.categoryRepository = categoryRepository;
    }

    // Get all categories
    public List<Category> getAllCategories() {

        return categoryRepository.findAll();
    }

    // Get active categories
    public List<Category> getActiveCategories() {

        return categoryRepository.findByActiveTrue();
    }

    // Get category by ID
    public Category getCategoryById(Long id) {

        return categoryRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Category not found with id: " + id
                        ));
    }

    // Search categories
    public List<Category> searchCategories(String name) {

        return categoryRepository
                .findByNameContainingIgnoreCase(name);
    }

    // Create category
    public Category createCategory(Category category) {

        if (category.getName() == null ||
                category.getName().trim().isEmpty()) {

            throw new RuntimeException(
                    "Category name is required"
            );
        }

        if (categoryRepository
                .existsByNameIgnoreCase(category.getName())) {

            throw new RuntimeException(
                    "Category already exists"
            );
        }

        category.setActive(true);

        return categoryRepository.save(category);
    }

    // Update category
    public Category updateCategory(
            Long id,
            Category updatedCategory) {

        Category existing = getCategoryById(id);

        if (updatedCategory.getName() == null ||
                updatedCategory.getName().trim().isEmpty()) {

            throw new RuntimeException(
                    "Category name is required"
            );
        }

        existing.setName(updatedCategory.getName());
        existing.setDescription(
                updatedCategory.getDescription()
        );

        return categoryRepository.save(existing);
    }

    // Activate / deactivate
    public Category updateStatus(
            Long id,
            boolean active) {

        Category category = getCategoryById(id);

        category.setActive(active);

        return categoryRepository.save(category);
    }

    // Soft delete
    public void deleteCategory(Long id) {

        Category category = getCategoryById(id);

        category.setActive(false);

        categoryRepository.save(category);
    }
}