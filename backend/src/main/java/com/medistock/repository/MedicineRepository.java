package com.medistock.repository;

import com.medistock.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    /** Free-text search over name, batch number, category name and supplier name. */
    @Query("SELECT m FROM Medicine m "
         + "WHERE (:keyword IS NULL OR :keyword = '' "
         + "  OR LOWER(m.name) LIKE LOWER(CONCAT('%', :keyword, '%')) "
         + "  OR LOWER(m.batchNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) "
         + "  OR LOWER(m.category.name) LIKE LOWER(CONCAT('%', :keyword, '%')) "
         + "  OR LOWER(m.supplier.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) "
         + "AND (:categoryId IS NULL OR m.category.id = :categoryId) "
         + "AND (:supplierId IS NULL OR m.supplier.id = :supplierId) "
         + "ORDER BY m.name ASC")
    List<Medicine> search(@Param("keyword") String keyword,
                          @Param("categoryId") Long categoryId,
                          @Param("supplierId") Long supplierId);

    /** Medicines at or below their own low-stock threshold (but not zero). */
    @Query("SELECT m FROM Medicine m WHERE m.quantity > 0 AND m.quantity <= m.lowStockThreshold")
    List<Medicine> findLowStock();

    Optional<Medicine> findByBatchNumber(String batchNumber);

    List<Medicine> findByQuantity(Integer quantity);

    List<Medicine> findByExpiryDateBefore(LocalDate date);

    List<Medicine> findByExpiryDateBetween(LocalDate start, LocalDate end);

    List<Medicine> findBySupplierId(Long supplierId);

    List<Medicine> findByCategoryId(Long categoryId);

    @Query("SELECT COALESCE(SUM(m.quantity * m.price), 0) FROM Medicine m")
    java.math.BigDecimal totalInventoryValue();
}
