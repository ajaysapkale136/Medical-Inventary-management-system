package com.medistock.service;

import com.medistock.entity.Medicine;
import com.medistock.entity.Purchase;
import com.medistock.entity.Supplier;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.PurchaseRepository;
import com.medistock.repository.SupplierRepository;
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
class SupplierServiceTest {

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private PurchaseRepository purchaseRepository;

    @InjectMocks
    private SupplierService supplierService;

    @Test
    void search_returnsAllSuppliersWhenKeywordBlank() {
        List<Supplier> suppliers = List.of(Supplier.builder().id(1L).name("Alpha").build());
        when(supplierRepository.findAll()).thenReturn(suppliers);

        List<Supplier> result = supplierService.search("   ");

        assertSame(suppliers, result);
    }

    @Test
    void search_filtersByNameIgnoringCase() {
        Supplier supplier = Supplier.builder().id(1L).name("MediSup").build();
        when(supplierRepository.findByNameContainingIgnoreCase("MEDISUP")).thenReturn(List.of(supplier));

        List<Supplier> result = supplierService.search("MEDISUP");

        assertEquals(1, result.size());
        assertEquals("MediSup", result.get(0).getName());
    }

    @Test
    void findById_returnsSupplierWhenExists() {
        Supplier supplier = Supplier.builder().id(7L).name("Beta").build();
        when(supplierRepository.findById(7L)).thenReturn(Optional.of(supplier));

        Supplier result = supplierService.findById(7L);

        assertSame(supplier, result);
    }

    @Test
    void findById_throwsWhenSupplierMissing() {
        when(supplierRepository.findById(10L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> supplierService.findById(10L));

        assertTrue(exception.getMessage().contains("10"));
    }

    @Test
    void update_copiesFieldsAndSaves() {
        Supplier existing = Supplier.builder().id(3L).name("Old").contactNumber("111").email("old@example.com").address("Old address").rating(1).build();
        Supplier data = Supplier.builder().name("New").contactNumber("222").email("new@example.com").address("New address").rating(4).build();
        when(supplierRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Supplier updated = supplierService.update(3L, data);

        assertEquals("New", updated.getName());
        assertEquals("222", updated.getContactNumber());
        assertEquals("new@example.com", updated.getEmail());
        assertEquals("New address", updated.getAddress());
        assertEquals(4, updated.getRating());
        verify(supplierRepository).save(existing);
    }

    @Test
    void medicinesOf_andPurchasesOf_delegateToRepositories() {
        List<Medicine> medicines = List.of(new Medicine());
        List<Purchase> purchases = List.of(new Purchase());
        when(medicineRepository.findBySupplierId(5L)).thenReturn(medicines);
        when(purchaseRepository.findBySupplierId(5L)).thenReturn(purchases);

        assertSame(medicines, supplierService.medicinesOf(5L));
        assertSame(purchases, supplierService.purchasesOf(5L));
    }
}
