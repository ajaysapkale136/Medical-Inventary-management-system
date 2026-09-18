package com.medistock.service;

import com.medistock.entity.Supplier;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final MedicineRepository medicineRepository;
    private final PurchaseRepository purchaseRepository;

    public List<Supplier> findAll() {
        return supplierRepository.findAll();
    }

    public List<Supplier> search(String keyword) {
        if (keyword == null || keyword.isBlank()) return findAll();
        return supplierRepository.findByNameContainingIgnoreCase(keyword);
    }

    public Supplier findById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + id));
    }

    public Supplier save(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    public Supplier update(Long id, Supplier data) {
        Supplier supplier = findById(id);
        supplier.setName(data.getName());
        supplier.setContactNumber(data.getContactNumber());
        supplier.setEmail(data.getEmail());
        supplier.setAddress(data.getAddress());
        if (data.getRating() != null) supplier.setRating(data.getRating());
        return supplierRepository.save(supplier);
    }

    public void delete(Long id) {
        supplierRepository.delete(findById(id));
    }

    /** Medicines currently supplied by this supplier. */
    public List<com.medistock.entity.Medicine> medicinesOf(Long supplierId) {
        return medicineRepository.findBySupplierId(supplierId);
    }

    /** Purchase history for this supplier. */
    public List<com.medistock.entity.Purchase> purchasesOf(Long supplierId) {
        return purchaseRepository.findBySupplierId(supplierId);
    }
}
