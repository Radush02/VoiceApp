package com.example.voiceapp.service.AuthService;

import com.example.voiceapp.collection.User;
import com.example.voiceapp.dtos.LoginDTO;
import com.example.voiceapp.dtos.RegisterDTO;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.InvalidInputException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.exceptions.NotPermittedException;
import com.example.voiceapp.repository.UserRepository;
import com.example.voiceapp.util.JwtUtil;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
  private final UserRepository userRepository;
  private final JwtUtil jwtUtil;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();


  @Override
  public CompletableFuture<Map<String, String>> registerUser(RegisterDTO registerDTO) {

    String normalizedEmail = registerDTO.getEmail().trim().toLowerCase();
    if (userRepository.existsByEmail(normalizedEmail)) {
      throw new AlreadyExistsException("There's already a user with this email.");
    }
    if (!StringUtils.hasText(registerDTO.getEmail()) || !registerDTO.getEmail().matches("^[\\w.-]+@[\\w.-]+\\.\\w+$")) {
      throw new InvalidInputException("Invalid email format.");
    }
    if (!registerDTO.getUsername().matches("^[a-zA-Z0-9._-]{3,20}$")) {
      throw new InvalidInputException("Username can only contain letters, numbers, dots, underscores, or hyphens.");
    }
    if (!StringUtils.hasText(registerDTO.getUsername()) || registerDTO.getUsername().length() < 3 || registerDTO.getUsername().length() > 20) {
      throw new InvalidInputException("Username must be between 3 and 20 characters.");
    }
    if (!StringUtils.hasText(registerDTO.getPassword()) || registerDTO.getPassword().length() < 8) {
      throw new InvalidInputException("Password must be at least 8 characters long.");
    }
    if (!registerDTO.getPassword().matches("^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$")) {
      throw new InvalidInputException("Password must include uppercase, lowercase, number, and special character.");
    }
    if (userRepository.existsByUsername(registerDTO.getUsername())) {
      throw new AlreadyExistsException("This username is already in use.");
    }
    User newUser =
        new User(
            null,
            "",
            registerDTO.getUsername(),
            passwordEncoder.encode(registerDTO.getPassword()),
            registerDTO.getEmail(),
            "",
            "");

    userRepository.save(newUser);
    return CompletableFuture.completedFuture(Map.of("message", "User registered successfully"));
  }

  @Override
  public CompletableFuture<Map<String,String>> authenticateUser(LoginDTO loginDTO) {
    String normalizedUsername = loginDTO.getUsername().trim().toLowerCase();
    User user =
        userRepository
            .findByUsernameIgnoreCase(normalizedUsername)
            .orElseThrow(() -> new NonExistentException("Invalid credentials"));

    if (user.isLocked() && user.getLockedUntil().isAfter(LocalDateTime.now())) {
      throw new NotPermittedException("Account is temporarily locked due to multiple failed login attempts.");
    }

    if (!passwordEncoder.matches(loginDTO.getPassword(), user.getPassword())) {
      user.incrementFailedAttempts();
      userRepository.save(user);
      throw new NonExistentException("Invalid credentials");
    }
    user.resetFailedAttempts();
    String accessToken = jwtUtil.generateToken(user.getUsername());
    String refreshToken = jwtUtil.generateRefreshToken(user.getUsername());
    user.setRefreshToken(refreshToken);
    userRepository.save(user);
    return CompletableFuture.completedFuture(Map.of(
            "access", accessToken,
            "refresh", refreshToken
    ));

  }

  @Override
  public String extractUsername() {
    return SecurityContextHolder.getContext().getAuthentication().getName();
  }
}
