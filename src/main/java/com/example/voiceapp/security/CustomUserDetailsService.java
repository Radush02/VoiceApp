package com.example.voiceapp.security;

import com.example.voiceapp.collection.User;
import com.example.voiceapp.repository.UserRepository;
import java.util.Collections;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

  @Autowired private UserRepository userRepository;

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    User user =
        userRepository
            .findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException(username));
    System.out.println("Loaded user: " + user.getUsername());
    return new org.springframework.security.core.userdetails.User(
        user.getUsername(), user.getPassword(), Collections.emptyList());
  }
}
