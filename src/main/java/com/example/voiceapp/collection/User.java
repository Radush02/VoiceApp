package com.example.voiceapp.collection;

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
  private String username;
  private String password;
  private String email;
  private Set<ChannelMembership> channels = new HashSet<>();
  private Set<String> friends = new HashSet<>();
  private Set<String> requests = new HashSet<>();
}
