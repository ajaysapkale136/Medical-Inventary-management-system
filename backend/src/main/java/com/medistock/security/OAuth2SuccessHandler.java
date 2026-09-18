package com.medistock.security;

import com.medistock.entity.Role;
import com.medistock.entity.User;
import com.medistock.repository.UserRepository;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

/**
 * After a successful Google login we create the user (as STAFF) if needed,
 * generate a JWT and redirect back to the React app with the token.
 */
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${medistock.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = (String) oAuth2User.getAttributes().get("email");
        String name = (String) oAuth2User.getAttributes().getOrDefault("name", email);

        User user = userRepository.findByEmail(email).orElseGet(() ->
                userRepository.save(User.builder()
                        .email(email)
                        .fullName(name)
                        .role(Role.STAFF) // Google sign-ups get the lowest role
                        .provider("GOOGLE")
                        .active(true)
                        .createdAt(LocalDateTime.now())
                        .build()));

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        String redirect = frontendUrl + "/oauth2/redirect?token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);

        getRedirectStrategy().sendRedirect(request, response, redirect);
    }
}
