package com.medistock.exception;

/** Thrown when an id does not exist in the database. */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
