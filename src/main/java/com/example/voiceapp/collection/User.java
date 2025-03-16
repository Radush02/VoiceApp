package com.example.voiceapp.collection;

import java.util.Map;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
@Getter
@Setter
public class User {
  @Id private String id;
  private String username;
  private String password;
  private String email;
  private Set<Map<String, String>> channels;
}
