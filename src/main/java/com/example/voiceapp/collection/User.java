package com.example.voiceapp.collection;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class User {
  @Id private String id;
  private String imageLink;
  private String username;
  private String password;
  private String email;
  private String status;
  private String aboutMe;
  private String refreshToken;
  private Set<ChannelMembership> channels = new HashSet<>();
  private Set<String> friends = new HashSet<>();
  private Set<String> requests = new HashSet<>();
  private int failedLoginAttempts = 0;
  private LocalDateTime lockedUntil;


  public User(String id, String imageLink, String username, String password, String email, String status, String aboutMe) {
    this.id = id;
    this.imageLink = imageLink;
    this.username = username;
    this.password = password;
    this.email = email;
    this.status = status;
    this.aboutMe = aboutMe;
  }
  public void incrementFailedAttempts() {
    this.failedLoginAttempts++;
    if (this.failedLoginAttempts >= 5) {
      this.lockedUntil = LocalDateTime.now().plusMinutes(15);
    }
  }

  public void resetFailedAttempts() {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
  }

  public boolean isLocked() {
    return lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now());
  }
}
