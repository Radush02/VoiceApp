package com.example.voiceapp.controllers;

import com.example.voiceapp.collection.Message;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.service.MessageService.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class ChatController {
  @Autowired private MessageService messageService;

  @Autowired private SimpMessagingTemplate messagingTemplate;

  @MessageMapping("/sendMessage/{channel}")
  public void sendMessage(@DestinationVariable String channel, @Payload Message message) {
    messageService.saveMessage(message);
    System.out.println("Broadcasting message to /channel/" + channel + ": " + message.getContent());
    messagingTemplate.convertAndSend("/channel/" + channel, message);
  }

  @ExceptionHandler(AlreadyExistsException.class)
  public ResponseEntity<Map<String,String>> handleAlreadyExistsException(AlreadyExistsException e) {
    return new ResponseEntity<>(Map.of("Error",e.getMessage()), HttpStatus.CONFLICT);
  }

  @ExceptionHandler(NonExistentException.class)
  public ResponseEntity<Map<String,String>> handleNonExistentException(NonExistentException e) {
    return new ResponseEntity<>(Map.of("Error",e.getMessage()), HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<Map<String,String>> handleRuntimeException(RuntimeException e) {
    return new ResponseEntity<>(Map.of("Error",e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
