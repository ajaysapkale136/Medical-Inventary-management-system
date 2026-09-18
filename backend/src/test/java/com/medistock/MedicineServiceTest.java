package com.medistock;

import com.medistock.entity.Medicine;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/** Simple unit tests for the medicine stock/expiry helpers. */
class MedicineServiceTest {

    @Test
    void detectsLowStock() {
        Medicine m = Medicine.builder().quantity(5).lowStockThreshold(10)
                .expiryDate(LocalDate.now().plusYears(1)).build();
        assertTrue(m.isLowStock());
        assertFalse(m.isOutOfStock());
        assertFalse(m.isExpired());
    }

    @Test
    void detectsOutOfStock() {
        Medicine m = Medicine.builder().quantity(0).lowStockThreshold(10)
                .expiryDate(LocalDate.now().plusYears(1)).build();
        assertTrue(m.isOutOfStock());
    }

    @Test
    void detectsExpired() {
        Medicine m = Medicine.builder().quantity(3).lowStockThreshold(10)
                .expiryDate(LocalDate.now().minusDays(1)).build();
        assertTrue(m.isExpired());
    }
}
