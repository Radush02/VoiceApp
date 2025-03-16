package com.example.voiceapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class VoiceAppApplication {

  public static void main(String[] args) {
    SpringApplication.run(VoiceAppApplication.class, args);
  }
}
