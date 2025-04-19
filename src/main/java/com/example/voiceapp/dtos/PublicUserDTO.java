package com.example.voiceapp.dtos;

import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PublicUserDTO {
  private String imageLink;
  private String username;
  private String status;
  private String aboutMe;
  private Set<String> friends = new HashSet<>();
}
