package com.v.demo;

import org.junit.jupiter.api.Test;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

public class DatabaseConfigurationTest {

    @Test
    void testAivenUriParsing() {
        String uriStr = "mysql://sample_user:sample_pass@db-host.example.com:12923/sampledb?ssl-mode=REQUIRED";

        URI uri = URI.create(uriStr);
        assertEquals("mysql", uri.getScheme());
        assertEquals("db-host.example.com", uri.getHost());
        assertEquals(12923, uri.getPort());
        assertEquals("/sampledb", uri.getPath());
        assertEquals("sample_user:sample_pass", uri.getUserInfo());

        String[] userParts = uri.getUserInfo().split(":", 2);
        assertEquals("sample_user", URLDecoder.decode(userParts[0], StandardCharsets.UTF_8));
        assertEquals("sample_pass", URLDecoder.decode(userParts[1], StandardCharsets.UTF_8));
    }
}
