package com.example.voiceapp.dtos;

import com.example.voiceapp.Enum.RequestResponse;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProcessFriendRequestDTO {
  String username;
  RequestResponse response;
}
