package com.medistock.service;

import com.medistock.entity.Category;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    void findAll_returnsAllCategoriesFromRepository() {
        List<Category> categories = List.of(Category.builder().id(1L).name("Antibiotic").build());
        when(categoryRepository.findAll()).thenReturn(categories);

        List<Category> result = categoryService.findAll();

        assertSame(categories, result);
        verify(categoryRepository).findAll();
    }

    @Test
    void findById_returnsCategoryWhenExists() {
        Category category = Category.builder().id(2L).name("Painkiller").build();
        when(categoryRepository.findById(2L)).thenReturn(Optional.of(category));

        Category result = categoryService.findById(2L);

        assertSame(category, result);
    }

    @Test
    void findById_throwsWhenCategoryMissing() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> categoryService.findById(99L));

        assertTrue(exception.getMessage().contains("99"));
    }

    @Test
    void update_changesNameAndDescriptionAndSaves() {
        Category existing = Category.builder().id(1L).name("Old").description("Old desc").build();
        Category updatedData = Category.builder().name("New").description("Updated desc").build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Category updated = categoryService.update(1L, updatedData);

        assertEquals("New", updated.getName());
        assertEquals("Updated desc", updated.getDescription());
        verify(categoryRepository).save(existing);
    }
}
