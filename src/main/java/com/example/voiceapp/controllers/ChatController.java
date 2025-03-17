package com.example.voiceapp.controllers;

import com.example.voiceapp.collection.Message;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.repository.MessageRepository;
import com.example.voiceapp.service.MessageService.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ChatController {
  @Autowired private MessageService messageService;

  @Autowired private SimpMessagingTemplate messagingTemplate;

  @MessageMapping("/sendMessage/{channel}")
  public void sendMessage(@DestinationVariable String channel, @Payload Message message) {
    try {
      messageService.saveMessage(message);
      System.out.println("Broadcasting message to /channel/" + channel + ": " + message.getContent());
      messagingTemplate.convertAndSend("/channel/" + channel, message);
    } catch (Exception e) {
      throw e;
    }
  }

  @ExceptionHandler(AlreadyExistsException.class)
  public ResponseEntity<String> handleAlreadyExistsException(AlreadyExistsException e) {
    return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
  }

  @ExceptionHandler(NonExistentException.class)
  public ResponseEntity<String> handleNonExistentException(NonExistentException e) {
    return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
  }
}
