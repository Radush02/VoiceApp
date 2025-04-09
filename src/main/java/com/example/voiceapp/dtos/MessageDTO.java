package com.example.voiceapp.dtos;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Setter
@Getter
public class MessageDTO {
  private String sender;
  private String content;
}
