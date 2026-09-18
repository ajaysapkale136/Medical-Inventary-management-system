package com.medistock.service;

import com.medistock.entity.Category;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    public Category findById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
    }

    public Category save(Category category) {
        return categoryRepository.save(category);
    }

    public Category update(Long id, Category data) {
        Category category = findById(id);
        category.setName(data.getName());
        category.setDescription(data.getDescription());
        return categoryRepository.save(category);
    }

    public void delete(Long id) {
        categoryRepository.delete(findById(id));
    }
}
