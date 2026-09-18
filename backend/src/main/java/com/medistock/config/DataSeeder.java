package com.medistock.config;

import com.medistock.entity.*;
import com.medistock.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Creates the very first ADMIN account plus a few demo rows the first time
 * the app starts. The API never allows creating another ADMIN.
 * Default login: admin@medistock.com / Admin@123
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final MedicineRepository medicineRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        upsertDefaultUser("admin@medistock.com", "System Admin", "Admin@123", Role.ADMIN);
        upsertDefaultUser("pharmacist@medistock.com", "Priya Pharmacist", "Pharma@123", Role.PHARMACIST);
        upsertDefaultUser("staff@medistock.com", "Sam Staff", "Staff@123", Role.STAFF);
        upsertDefaultUser("supplier@medistock.com", "HealthPlus Supplier", "Supplier@123", Role.SUPPLIER);

        Category antibiotic = upsertCategory("Antibiotic", "Bacterial infections");
        Category painkiller = upsertCategory("Painkiller", "Pain relief");
        Category syrup = upsertCategory("Syrup", "Liquid medicines");

        Supplier s1 = upsertSupplier("HealthPlus Distributors", "9876543210", "sales@healthplus.com",
                "12 MG Road, Bengaluru", 5);
        Supplier s2 = upsertSupplier("MediSource Pvt Ltd", "9123456780", "contact@medisource.com",
                "45 Anna Salai, Chennai", 4);

        upsertMedicine("Amoxicillin 500mg", "AMX-1001", antibiotic, s1, 120, 30,
                LocalDate.now().minusMonths(6), LocalDate.now().plusMonths(10), new BigDecimal("45.50"));

        upsertMedicine("Paracetamol 650mg", "PCM-2007", painkiller, s2, 12, 25,
                LocalDate.now().minusMonths(3), LocalDate.now().plusDays(20), new BigDecimal("18.00"));

        upsertMedicine("Cough Syrup 100ml", "CS-3300", syrup, s1, 0, 15,
                LocalDate.now().minusYears(2), LocalDate.now().minusDays(5), new BigDecimal("95.00"));
    }

    private void upsertDefaultUser(String email, String fullName, String rawPassword, Role role) {
        User user = userRepository.findByEmail(email).orElseGet(() -> User.builder().email(email).build());
        user.setFullName(fullName);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setActive(true);
        user.setProvider("LOCAL");
        userRepository.save(user);
    }

    private Category upsertCategory(String name, String description) {
        return categoryRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> categoryRepository.save(Category.builder().name(name).description(description).build()));
    }

    private Supplier upsertSupplier(String name, String contactNumber, String email, String address, int rating) {
        return supplierRepository.findByEmailIgnoreCase(email)
                .orElseGet(() -> supplierRepository.save(Supplier.builder()
                        .name(name)
                        .contactNumber(contactNumber)
                        .email(email)
                        .address(address)
                        .rating(rating)
                        .build()));
    }

    private void upsertMedicine(String name, String batchNumber, Category category, Supplier supplier,
                                int quantity, int lowStockThreshold, LocalDate manufacturingDate,
                                LocalDate expiryDate, BigDecimal price) {
        medicineRepository.findByBatchNumber(batchNumber)
                .ifPresentOrElse(medicine -> {
                    medicine.setName(name);
                    medicine.setCategory(category);
                    medicine.setSupplier(supplier);
                    medicine.setQuantity(quantity);
                    medicine.setLowStockThreshold(lowStockThreshold);
                    medicine.setManufacturingDate(manufacturingDate);
                    medicine.setExpiryDate(expiryDate);
                    medicine.setPrice(price);
                    medicineRepository.save(medicine);
                }, () -> medicineRepository.save(Medicine.builder()
                        .name(name)
                        .batchNumber(batchNumber)
                        .category(category)
                        .supplier(supplier)
                        .quantity(quantity)
                        .lowStockThreshold(lowStockThreshold)
                        .manufacturingDate(manufacturingDate)
                        .expiryDate(expiryDate)
                        .price(price)
                        .build()));
    }
}
