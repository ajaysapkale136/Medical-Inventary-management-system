package com.medistock.security;

import com.medistock.entity.Role;
import com.medistock.entity.User;
import com.medistock.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService userDetailsService;

    @Test
    void loadUserByUsername_returnsUserDetailsForActiveUser() {
        User user = User.builder()
                .email("admin@medistock.com")
                .password("$2a$10$encoded")
                .role(Role.ADMIN)
                .active(true)
                .build();
        when(userRepository.findByEmail("admin@medistock.com")).thenReturn(Optional.of(user));

        UserDetails details = userDetailsService.loadUserByUsername("admin@medistock.com");

        assertEquals("admin@medistock.com", details.getUsername());
        assertEquals("$2a$10$encoded", details.getPassword());
        assertTrue(details.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN")));
        assertTrue(details.isEnabled());
        verify(userRepository).findByEmail("admin@medistock.com");
    }

    @Test
    void loadUserByUsername_usesNoopPasswordForOAuthUsersAndDisablesInactiveAccounts() {
        User user = User.builder()
                .email("staff@medistock.com")
                .password(null)
                .role(Role.STAFF)
                .active(false)
                .build();
        when(userRepository.findByEmail("staff@medistock.com")).thenReturn(Optional.of(user));

        UserDetails details = userDetailsService.loadUserByUsername("staff@medistock.com");

        assertEquals("{noop}oauth2", details.getPassword());
        assertFalse(details.isEnabled());
    }

    @Test
    void loadUserByUsername_throwsWhenUserDoesNotExist() {
        when(userRepository.findByEmail("missing@medistock.com")).thenReturn(Optional.empty());

        UsernameNotFoundException exception = assertThrows(UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername("missing@medistock.com"));

        assertTrue(exception.getMessage().contains("missing@medistock.com"));
    }
}
