package com.example.voiceapp.exceptions;

public class NotPermittedException extends RuntimeException {
  public NotPermittedException(String message) {
    super(message);
  }
}
