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
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService implements AuthServiceImpl {
  private final UserRepository userRepository;
  private final JwtUtil jwtUtil;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public Map<String, String> registerUser(RegisterDTO registerDTO) {
    if (userRepository.existsByEmail(registerDTO.getEmail())) {
      throw new AlreadyExistsException("There's already a user with this email.");
    }
    if (userRepository.existsByUsername(registerDTO.getUsername())) {
      throw new AlreadyExistsException("This username is already in use.");
    }
    User newUser =
        new User(
            null,
            registerDTO.getUsername(),
            passwordEncoder.encode(registerDTO.getPassword()),
            registerDTO.getEmail(),
            new HashSet<>());
    userRepository.save(newUser);
    return Map.of("message", "User registered successfully");
  }

  public Map<String, String> authenticateUser(LoginDTO loginDTO) {
    User user =
        userRepository
            .findByUsername(loginDTO.getUsername())
            .orElseThrow(() -> new NonExistentException("Invalid credentials"));

    if (!passwordEncoder.matches(loginDTO.getPassword(), user.getPassword())) {
      throw new NonExistentException("Invalid credentials");
    }
    String token = jwtUtil.generateToken(user.getUsername());
    return Map.of("token", token);
  }
}
