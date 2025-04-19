package com.example.voiceapp.controllers;

import com.example.voiceapp.dtos.LoginDTO;
import com.example.voiceapp.dtos.RegisterDTO;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.service.AuthService.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/auth")
public class AuthController {

  @Autowired private AuthService authService;

  @PostMapping("/register")
  public ResponseEntity<?> register(@RequestBody RegisterDTO registerDTO) {
    //        System.out.println(registerDTO.getUsername());
    //        System.out.println(registerDTO.getPassword());
    //        System.out.println(registerDTO.getEmail());
    return new ResponseEntity<>(authService.registerUser(registerDTO), HttpStatus.CREATED);
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginDTO loginDTO, HttpServletResponse response)
      throws ExecutionException, InterruptedException {
    CompletableFuture<String> token = authService.authenticateUser(loginDTO);

    ResponseCookie jwtCookie =
        ResponseCookie.from("jwt", token.get())
            .httpOnly(true)
            .secure(false)
            .path("/")
            .maxAge(60 * 60 * 24)
            .sameSite("Strict")
            .build();

    response.addHeader(HttpHeaders.SET_COOKIE, jwtCookie.toString());

    return ResponseEntity.ok(Map.of("response", "Login successful"));
  }

  @PostMapping("/logout")
  public ResponseEntity<?> logout(HttpServletResponse response) {
    ResponseCookie cookie =
        ResponseCookie.from("jwt", "").httpOnly(true).secure(false).path("/").maxAge(0).build();

    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

    return ResponseEntity.ok(Map.of("response", "Logged out successful"));
  }

  @PostMapping("/check")
  public ResponseEntity<?> isAuthenticated(HttpServletRequest response) {
    System.out.println(response);
    return ResponseEntity.ok(Map.of("isAuthenticated", true));
  }

  @GetMapping("/user/me")
  public ResponseEntity<?> getCurrentUser() {
    return ResponseEntity.ok(Map.of("username", authService.extractUsername()));
  }

  @ExceptionHandler(AlreadyExistsException.class)
  public ResponseEntity<Map<String, String>> handleAlreadyExistsException(
      AlreadyExistsException e) {
    return new ResponseEntity<>(Map.of("Error", e.getMessage()), HttpStatus.CONFLICT);
  }

  @ExceptionHandler(NonExistentException.class)
  public ResponseEntity<Map<String, String>> handleNonExistentException(NonExistentException e) {
    return new ResponseEntity<>(Map.of("Error", e.getMessage()), HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
    return new ResponseEntity<>(Map.of("Error", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
