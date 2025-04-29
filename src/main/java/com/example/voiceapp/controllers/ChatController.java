package com.example.voiceapp.controllers;

import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.collection.Message;
import com.example.voiceapp.collection.User;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.exceptions.NotPermittedException;
import com.example.voiceapp.repository.ChannelRepository;
import com.example.voiceapp.repository.UserRepository;
import com.example.voiceapp.service.MessageService.MessageService;

import java.security.Principal;
import java.util.Map;
import java.util.Objects;

import com.example.voiceapp.service.MessageService.MessageServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
public class ChatController {
  @Autowired private MessageServiceImpl messageService;
  @Autowired private SimpMessagingTemplate messagingTemplate;

  @MessageMapping("/sendMessage/{channel}")
  public void sendMessage(@DestinationVariable String channel,
                          @Payload Message message,
                          Principal principal) {
    if (principal == null) {
      throw new NotPermittedException("Unauthorized");
    }
    String username = principal.getName();
    messageService.processChannelMessage(username, channel, message);
  }


  @MessageMapping("/sendPrivateMessage/{recipient}")
  public void sendPrivateMessage(@DestinationVariable String recipient,
                                 @Payload Message message,
                                 Principal principal) {
    if (principal == null) {
      throw new NotPermittedException("Unauthorized");
    }
    messageService.processDirectMessage(principal.getName(), recipient, message);
    messagingTemplate.convertAndSendToUser(recipient, "/queue/messages", message);
  }
  @ExceptionHandler(AlreadyExistsException.class)
  public ResponseEntity<Map<String, String>> handleAlreadyExistsException(
      AlreadyExistsException e) {
    return new ResponseEntity<>(Map.of("Error", e.getMessage()), HttpStatus.CONFLICT);
  }

  @ExceptionHandler(NonExistentException.class)
  public ResponseEntity<Map<String, String>> handleNonExistentException(NonExistentException e) {
    return new ResponseEntity<>(Map.of("Error", e.getMessage()), HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
    return new ResponseEntity<>(Map.of("Error", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
