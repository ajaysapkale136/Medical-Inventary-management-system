package com.v.medical.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(
            ResponseStatusException exception) {
        return error(exception.getStatusCode().value(), exception.getReason());
    }

    @ExceptionHandler({IllegalArgumentException.class, HttpMessageNotReadableException.class})
    public ResponseEntity<Map<String, Object>> handleBadRequest(Exception exception) {
        return error(HttpStatus.BAD_REQUEST.value(), message(exception, "Invalid request"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(DataIntegrityViolationException exception) {
        return error(HttpStatus.CONFLICT.value(), "This record conflicts with existing data");
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException exception) {
        String message = message(exception, "Request could not be completed");
        String normalized = message.toLowerCase();
        int status = normalized.contains("not found") ? HttpStatus.NOT_FOUND.value()
                : normalized.contains("already") || normalized.contains("duplicate")
                ? HttpStatus.CONFLICT.value() : HttpStatus.BAD_REQUEST.value();
        return error(status, status == HttpStatus.BAD_REQUEST.value()
                ? "Request could not be completed"
                : message);
    }

    private ResponseEntity<Map<String, Object>> error(int status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "status", status,
                "message", message == null ? "Request could not be completed" : message,
                "timestamp", Instant.now().toString()
        ));
    }

    private String message(Exception exception, String fallback) {
        return exception.getMessage() == null || exception.getMessage().isBlank()
                ? fallback : exception.getMessage();
    }
}
