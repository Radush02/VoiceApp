package com.example.voiceapp.collection;

import com.example.voiceapp.Enum.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Date;

@Getter
@AllArgsConstructor
public class ChannelMembership {
  private String vanityId;
  private Role role;
  private Date joinDate;
}
