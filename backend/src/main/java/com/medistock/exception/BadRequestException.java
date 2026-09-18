package com.medistock.exception;

/** Thrown for invalid input or forbidden business operations. */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
