package com.example.voiceapp.service.AuthService;

import com.example.voiceapp.dtos.LoginDTO;
import com.example.voiceapp.dtos.RegisterDTO;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public interface AuthServiceImpl {

  CompletableFuture<Map<String, String>> registerUser(RegisterDTO registerDTO);

  CompletableFuture<String> authenticateUser(LoginDTO loginDTO);

  String extractUsername();
}
