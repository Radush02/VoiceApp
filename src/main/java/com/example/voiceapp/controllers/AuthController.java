package com.example.voiceapp.controllers;

import com.example.voiceapp.dtos.LoginDTO;
import com.example.voiceapp.dtos.RegisterDTO;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.service.AuthService.AuthService;
import com.example.voiceapp.util.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.async.DeferredResult;

@RestController
@RequestMapping("api/auth")
public class AuthController {

  @Autowired private AuthService authService;
  @Autowired private JwtUtil jwtUtil;

  @PostMapping("/register")
  public DeferredResult<ResponseEntity<Map<String, String>>> register(@RequestBody RegisterDTO registerDTO) {
    DeferredResult<ResponseEntity<Map<String, String>>> output = new DeferredResult<>();
    authService.registerUser(registerDTO).thenAccept(result ->
            output.setResult(new ResponseEntity<>(result, HttpStatus.CREATED))
    ).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(Map.of("Error", ex.getMessage())));
      return null;
    });
    return output;
  }

  @PostMapping("/login")
  public DeferredResult<ResponseEntity<Map<String, String>>> login(@RequestBody LoginDTO loginDTO, HttpServletResponse response) {
    DeferredResult<ResponseEntity<Map<String, String>>> output = new DeferredResult<>();

    authService.authenticateUser(loginDTO).thenAccept(tokens -> {
      String accessToken = tokens.get("access");
      String refreshToken = tokens.get("refresh");

      ResponseCookie jwtCookie = ResponseCookie.from("jwt", accessToken)
              .httpOnly(true)
              .secure(true)
              .path("/")
              .maxAge(60 * 60)
              .sameSite("None")
              .build();

      ResponseCookie refreshCookie = ResponseCookie.from("refresh", refreshToken)
              .httpOnly(true)
              .secure(true)
              .path("/api/auth/refresh")
              .maxAge(60L * 60L * 24L * 30L)
              .sameSite("None")
              .build();

      response.addHeader(HttpHeaders.SET_COOKIE, jwtCookie.toString());
      response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

      output.setResult(ResponseEntity.ok(Map.of("response", "Login successful")));
    }).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
              .body(Map.of("Error", ex.getMessage())));
      return null;
    });

    return output;
  }

  @PostMapping("/refresh")
  public ResponseEntity<Map<String, String>> refreshToken(HttpServletRequest request, HttpServletResponse response) {
    String refreshToken = null;

    if (request.getCookies() != null) {
      for (Cookie cookie : request.getCookies()) {
        if ("refresh".equals(cookie.getName())) {
          refreshToken = cookie.getValue();
          break;
        }
      }
    }
    if (refreshToken == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("Error", "Refresh token is missing"));
    }
    String username = jwtUtil.extractUsername(refreshToken);
    String newAccessToken = jwtUtil.generateToken(username);

    ResponseCookie jwtCookie = ResponseCookie.from("jwt", newAccessToken)
              .httpOnly(true)
              .secure(false)
              .path("/")
              .maxAge(60 * 60)
              .sameSite("Strict")
              .build();

      response.addHeader(HttpHeaders.SET_COOKIE, jwtCookie.toString());

      return ResponseEntity.ok(Map.of("access", newAccessToken));
    }


  @PostMapping("/logout")
  public ResponseEntity<?> logout(HttpServletResponse response) {
    ResponseCookie cookie = ResponseCookie.from("jwt", "").httpOnly(true).secure(false).path("/").maxAge(0).build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    return ResponseEntity.ok(Map.of("response", "Logged out successfully"));
  }

  @PostMapping("/check")
  public ResponseEntity<?> isAuthenticated(HttpServletRequest request) {
    return ResponseEntity.ok(Map.of("isAuthenticated", true));
  }

  @GetMapping("/user/me")
  public ResponseEntity<?> getCurrentUser() {
    return ResponseEntity.ok(Map.of("username", authService.extractUsername()));
  }

  @ExceptionHandler(AlreadyExistsException.class)
  public ResponseEntity<Map<String, String>> handleAlreadyExistsException(AlreadyExistsException e) {
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
