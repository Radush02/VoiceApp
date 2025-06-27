package com.example.voiceapp.dtos;

import com.example.voiceapp.Enum.Role;
import com.example.voiceapp.Enum.Status;
import com.example.voiceapp.collection.ChannelMembership;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserDTO {
  private String imageLink;
  private String username;
  private String status;
  private String aboutMe;
  private Set<ChannelMembership> channels = new HashSet<>();
  private Set<String> friends = new HashSet<>();
  private Set<String> requests = new HashSet<>();
  private Role role;
}
