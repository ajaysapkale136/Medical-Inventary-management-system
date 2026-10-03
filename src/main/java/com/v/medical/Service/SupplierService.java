package com.v.medical.Service;

import com.v.medical.entity.Supplier;
import com.v.medical.entity.SupplierStatus;
import com.v.medical.repository.SupplierRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(
            SupplierRepository supplierRepository) {

        this.supplierRepository = supplierRepository;
    }

    // Get all suppliers
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAllByOrderByCompanyNameAsc();
    }

    // Get active suppliers
    public List<Supplier> getActiveSuppliers() {
        return supplierRepository.findByStatusOrderByCompanyNameAsc(SupplierStatus.ACTIVE);
    }

    // Get supplier by ID
    public Supplier getSupplierById(Long id) {

        return supplierRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Supplier not found with id: " + id
                        ));
    }

    // Search supplier
    public List<Supplier> searchSuppliers(String name) {

        return supplierRepository
                .findByCompanyNameContainingIgnoreCase(name);
    }

    // Add supplier
    public Supplier createSupplier(Supplier supplier) {

        if (supplier.getOutstandingBalance() == null) {
            supplier.setOutstandingBalance(BigDecimal.ZERO);
        }

        if (supplier.getCreditLimit() == null) {
            supplier.setCreditLimit(BigDecimal.ZERO);
        }

        if (supplier.getStatus() == null) {
            supplier.setStatus(SupplierStatus.ACTIVE);
        }

        return supplierRepository.save(supplier);
    }

    // Update supplier
    public Supplier updateSupplier(
            Long id,
            Supplier updatedSupplier) {

        Supplier existing = getSupplierById(id);

        existing.setCompanyName(updatedSupplier.getCompanyName());
        existing.setSupplierType(updatedSupplier.getSupplierType());
        existing.setContactPerson(
                updatedSupplier.getContactPerson()
        );
        existing.setPhone(
                updatedSupplier.getPhone()
        );
        existing.setEmail(updatedSupplier.getEmail());
        existing.setAddress(updatedSupplier.getAddress());
        existing.setCity(updatedSupplier.getCity());
        existing.setState(updatedSupplier.getState());
        existing.setPostalCode(updatedSupplier.getPostalCode());
        existing.setGstNumber(updatedSupplier.getGstNumber());
        existing.setTaxNumber(updatedSupplier.getTaxNumber());
        existing.setBankName(updatedSupplier.getBankName());
        existing.setAccountNumber(updatedSupplier.getAccountNumber());
        existing.setIfscCode(updatedSupplier.getIfscCode());
        existing.setCreditLimit(
                updatedSupplier.getCreditLimit()
        );
        existing.setOutstandingBalance(
                updatedSupplier.getOutstandingBalance()
        );
        existing.setPaymentTerms(
                updatedSupplier.getPaymentTerms()
        );
        existing.setStatus(
                updatedSupplier.getStatus() == null
                        ? existing.getStatus()
                        : updatedSupplier.getStatus()
        );

        return supplierRepository.save(existing);
    }

    // Activate / deactivate supplier
    public Supplier updateStatus(
            Long id,
            boolean active) {

        Supplier supplier = getSupplierById(id);

        supplier.setStatus(active ? SupplierStatus.ACTIVE : SupplierStatus.INACTIVE);

        return supplierRepository.save(supplier);
    }

    // Delete supplier
    public void deleteSupplier(Long id) {

        Supplier supplier = getSupplierById(id);

        // Soft delete
        supplier.setStatus(SupplierStatus.INACTIVE);

        supplierRepository.save(supplier);
    }
}
