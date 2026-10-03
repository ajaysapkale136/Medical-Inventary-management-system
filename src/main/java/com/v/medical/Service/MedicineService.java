package com.v.medical.Service;

import com.v.medical.entity.Category;
import com.v.medical.entity.Medicine;
import com.v.medical.entity.Supplier;
import com.v.medical.repository.CategoryRepository;
import com.v.medical.repository.MedicineRepository;
import com.v.medical.repository.SupplierRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicineService {

    private final MedicineRepository medicineRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;

    public MedicineService(
            MedicineRepository medicineRepository,
            CategoryRepository categoryRepository,
            SupplierRepository supplierRepository) {
        this.medicineRepository = medicineRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
    }

    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    public Medicine getMedicineById(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Medicine not found with id: " + id
                        ));
    }

    public List<Medicine> searchMedicines(String name) {
        return medicineRepository
                .findByNameContainingIgnoreCase(name);
    }

    public Medicine createMedicine(
            Medicine medicine,
            Long categoryId,
            Long supplierId) {
        applyRelationships(medicine, categoryId, supplierId);
        return medicineRepository.save(medicine);
    }

    public Medicine updateMedicine(
            Long id,
            Medicine updatedMedicine,
            Long categoryId,
            Long supplierId) {

        Medicine existing = getMedicineById(id);

        if (updatedMedicine.getName() != null) existing.setName(updatedMedicine.getName());
        if (updatedMedicine.getGenericName() != null) existing.setGenericName(updatedMedicine.getGenericName());
        if (updatedMedicine.getDosage() != null) existing.setDosage(updatedMedicine.getDosage());
        if (updatedMedicine.getUnit() != null) existing.setUnit(updatedMedicine.getUnit());
        if (updatedMedicine.getPrice() != null) existing.setPrice(updatedMedicine.getPrice());
        if (updatedMedicine.getReorderLevel() != null) existing.setReorderLevel(updatedMedicine.getReorderLevel());

        applyRelationships(existing, categoryId, supplierId);

        return medicineRepository.save(existing);
    }

    public void deleteMedicine(Long id) {

        Medicine medicine = getMedicineById(id);

        // Soft delete
        medicine.setActive(false);

        medicineRepository.save(medicine);
    }

    private void applyRelationships(
            Medicine medicine,
            Long categoryId,
            Long supplierId) {
        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            medicine.setCategory(category);
        }
        if (supplierId != null) {
            Supplier supplier = supplierRepository.findById(supplierId)
                    .orElseThrow(() -> new RuntimeException("Supplier not found"));
            medicine.setSupplier(supplier);
        }
    }
}
