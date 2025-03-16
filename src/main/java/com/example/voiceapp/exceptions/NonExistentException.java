package com.example.voiceapp.exceptions;

/**
 * Exceptie aruncata in cazul in care un obiect nu exista.
 */
public class NonExistentException extends RuntimeException {
    public NonExistentException(String message) {
        super(message);
    }
}