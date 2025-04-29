package com.example.voiceapp.service.AuthService;

import com.example.voiceapp.collection.User;
import com.example.voiceapp.dtos.LoginDTO;
import com.example.voiceapp.dtos.RegisterDTO;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.repository.UserRepository;
import com.example.voiceapp.util.JwtUtil;
import java.util.HashSet;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService implements AuthServiceImpl {
  private final UserRepository userRepository;
  private final JwtUtil jwtUtil;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();


  @Override
  public CompletableFuture<Map<String, String>> registerUser(RegisterDTO registerDTO) {
    if (userRepository.existsByEmail(registerDTO.getEmail())) {
      throw new AlreadyExistsException("There's already a user with this email.");
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
            "",
            new HashSet<>(),new HashSet<>(),new HashSet<>());

    userRepository.save(newUser);
    return CompletableFuture.completedFuture(Map.of("message", "User registered successfully"));
  }

  @Override
  public CompletableFuture<String> authenticateUser(LoginDTO loginDTO) {
    User user =
        userRepository
            .findByUsername(loginDTO.getUsername())
            .orElseThrow(() -> new NonExistentException("Invalid credentials"));

    if (!passwordEncoder.matches(loginDTO.getPassword(), user.getPassword())) {
      throw new NonExistentException("Invalid credentials");
    }
    return CompletableFuture.completedFuture(jwtUtil.generateToken(user.getUsername()));
  }

  @Override
  public String extractUsername() {
    return SecurityContextHolder.getContext().getAuthentication().getName();
  }
}
