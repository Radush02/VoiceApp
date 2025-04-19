package com.example.voiceapp.dtos;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Setter
@Getter
public class ChannelDTO {
  private String name;
  private String vanityId;
  private MultipartFile file;
}
