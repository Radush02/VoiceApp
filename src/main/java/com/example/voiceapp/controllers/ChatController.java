package com.example.voiceapp.controllers;


import com.example.voiceapp.collection.Message;

import com.example.voiceapp.dtos.SignalMessageDTO;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.exceptions.NotPermittedException;


import java.security.Principal;
import java.util.Map;

import com.example.voiceapp.service.MessageService.MessageServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
    messageService
            .processChannelMessage(username, channel, message)
            .thenAccept(savedMessage -> {
              messagingTemplate
                      .convertAndSend("/channel/" + channel, savedMessage);
            });
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

  @MessageMapping("/signal/{channel}")
  public void signal(@DestinationVariable String channel,
                     @Payload SignalMessageDTO msg,
                     Principal principal) {
    msg.setFrom(principal.getName());
    messagingTemplate.convertAndSend(
            "/channel/"+channel+"/signal",
            msg
    );
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
