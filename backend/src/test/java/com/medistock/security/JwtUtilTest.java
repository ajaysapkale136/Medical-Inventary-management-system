package com.medistock.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "0123456789abcdef0123456789abcdef");
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 60_000L);
    }

    @Test
    void generateToken_extractsEmailAndValidatesSuccessfully() {
        String token = jwtUtil.generateToken("admin@medistock.com", "ADMIN");

        assertNotNull(token);
        assertEquals("admin@medistock.com", jwtUtil.extractEmail(token));
        assertTrue(jwtUtil.isValid(token));
    }

    @Test
    void isValid_returnsFalseForMalformedToken() {
        assertFalse(jwtUtil.isValid("not-a-valid-token"));
    }
}
