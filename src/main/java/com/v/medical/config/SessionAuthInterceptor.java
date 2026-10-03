package com.v.medical.config;

import com.v.medical.entity.Role;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

@Component
public class SessionAuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws IOException {

        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "SAMEORIGIN");
        response.setHeader("X-XSS-Protection", "1; mode=block");
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "Please sign in to continue");
            return false;
        }

        Role role = (Role) session.getAttribute("role");
        if (role == null) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "Your session is invalid. Please sign in again");
            return false;
        }

        if (role == Role.ADMIN || isPermittedForRole(request, role)) {
            return true;
        }

        writeError(response, HttpServletResponse.SC_FORBIDDEN,
                "You do not have permission for this action");
        return false;
    }

    private boolean isPermittedForRole(HttpServletRequest request, Role role) {
        String path = request.getRequestURI();
        boolean readOnly = HttpMethod.GET.matches(request.getMethod());

        if (path.startsWith("/api/users") || path.startsWith("/api/admin")
                || path.startsWith("/api/system-settings")) {
            return false;
        }

        if (role == Role.PHARMACIST) {
            return true;
        }

        if (readOnly) {
            return true;
        }

        return path.startsWith("/api/inventory/stock-in")
                || path.startsWith("/api/inventory/stock-out")
                || path.startsWith("/api/inventory/adjustment")
                || path.startsWith("/api/inventory/return")
                || path.startsWith("/api/inventory/transfer")
                || path.startsWith("/api/staff/notifications/")
                || path.startsWith("/api/notifications/")
                || path.startsWith("/api/preferences")
                || path.startsWith("/api/staff/orders/")
                || path.startsWith("/api/staff/reports/generate")
                || path.startsWith("/api/transfers")
                || isStaffPurchaseOrderCreate(request);
    }

    private boolean isStaffPurchaseOrderCreate(HttpServletRequest request) {
        String path = request.getRequestURI();
        return HttpMethod.POST.matches(request.getMethod())
                && path.equals("/api/purchase-orders");
    }

    private void writeError(
            HttpServletResponse response,
            int status,
            String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"status\":" + status
                + ",\"message\":\"" + escapeJson(message) + "\"}");
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
