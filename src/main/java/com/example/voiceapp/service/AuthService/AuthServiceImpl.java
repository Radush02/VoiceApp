package com.example.voiceapp.service.AuthService;

import com.example.voiceapp.dtos.LoginDTO;
import com.example.voiceapp.dtos.RegisterDTO;
import java.util.Map;

public interface AuthServiceImpl {

  Map<String, String> registerUser(RegisterDTO registerDTO);

  String authenticateUser(LoginDTO loginDTO);
}
