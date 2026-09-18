package com.medistock;

import com.medistock.dto.AuthDtos.CreateUserRequest;
import com.medistock.entity.Role;
import com.medistock.entity.User;
import com.medistock.exception.BadRequestException;
import com.medistock.repository.UserRepository;
import com.medistock.service.NotificationService;
import com.medistock.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** JUnit 5 + Mockito tests for the role hierarchy rules. */
@ExtendWith(MockitoExtension.class)
class UserServiceRoleHierarchyTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private NotificationService notificationService;

    @InjectMocks private UserService userService;

    private User admin()      { return User.builder().fullName("A").email("a@x.com").role(Role.ADMIN).build(); }
    private User pharmacist() { return User.builder().fullName("P").email("p@x.com").role(Role.PHARMACIST).build(); }
    private User staff()      { return User.builder().fullName("S").email("s@x.com").role(Role.STAFF).build(); }

    private CreateUserRequest request(Role role) {
        return new CreateUserRequest("New User", "new@x.com", "secret123", "9999999999", role);
    }

    @Test
    void adminCanCreatePharmacist() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User created = userService.createUser(request(Role.PHARMACIST), admin());
        assertEquals(Role.PHARMACIST, created.getRole());
    }

    @Test
    void pharmacistCannotCreatePharmacist() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> userService.createUser(request(Role.PHARMACIST), pharmacist()));
        assertTrue(ex.getMessage().contains("only create Staff"));
    }

    @Test
    void nobodyCanCreateAdmin() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User created = userService.createUser(request(Role.ADMIN), admin());
        assertEquals(Role.ADMIN, created.getRole());
    }

    @Test
    void staffCannotCreateUsers() {
        assertThrows(BadRequestException.class, () -> userService.createUser(request(Role.STAFF), staff()));
    }
}
