package com.medistock.config;

import com.medistock.entity.Role;
import com.medistock.entity.User;
import com.medistock.repository.CategoryRepository;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.SupplierRepository;
import com.medistock.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataSeederTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private DataSeeder dataSeeder;

    @Test
    void runShouldRefreshExistingDefaultUsersWithCorrectPassword() {
        User existingAdmin = new User();
        existingAdmin.setEmail("admin@medistock.com");
        existingAdmin.setRole(Role.ADMIN);
        existingAdmin.setActive(true);

        when(userRepository.findByEmail("admin@medistock.com")).thenReturn(Optional.of(existingAdmin));
        when(userRepository.findByEmail("pharmacist@medistock.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("staff@medistock.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Admin@123")).thenReturn("encoded-admin-password");
        when(passwordEncoder.encode("Pharma@123")).thenReturn("encoded-pharma-password");
        when(passwordEncoder.encode("Staff@123")).thenReturn("encoded-staff-password");

        dataSeeder.run();

        verify(userRepository).save(org.mockito.ArgumentMatchers.argThat(user ->
                "admin@medistock.com".equals(user.getEmail()) && "encoded-admin-password".equals(user.getPassword())
        ));
    }
}
