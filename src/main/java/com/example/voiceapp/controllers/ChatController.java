package com.example.voiceapp.controllers;


import com.example.voiceapp.collection.Message;

import com.example.voiceapp.dtos.SeenReceiptDTO;
import com.example.voiceapp.dtos.SignalMessageDTO;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.exceptions.NotPermittedException;


import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.example.voiceapp.service.CallService.CallService;
import com.example.voiceapp.service.MessageService.MessageService;
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
  @Autowired private MessageService messageService;
  @Autowired private SimpMessagingTemplate messagingTemplate;
  @Autowired private CallService callService;

  @GetMapping("/api/call/{channel}/status")
  public ResponseEntity<Map<String, Boolean>> getCallStatus(@PathVariable String channel) {
    boolean active = callService.isCallActive(channel);
    return new ResponseEntity<>(Map.of("active", active), HttpStatus.OK);
  }


  @PostMapping("/api/call/{channel}/join")
  public ResponseEntity<Map<String, Boolean>> joinCall(@PathVariable String channel, Principal principal) {
    if (principal == null) {
      throw new NotPermittedException("Unauthorized");
    }
    String username = principal.getName();
    boolean isInitiator = callService.attemptJoinCall(channel, username);
    return new ResponseEntity<>(Map.of("isInitiator", isInitiator), HttpStatus.OK);
  }


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

  @MessageMapping("/typing/{channel}")
  public void typing(@DestinationVariable String channel, Principal principal) {
    if (principal != null) {
      String username = principal.getName();
      System.out.println("Typing event from: " + username + " in channel: " + channel);

      messagingTemplate.convertAndSend("/channel/" + channel + "/typing", Map.of("from", username));
    }
  }
  @MessageMapping("/typingPrivate/{recipient}")
  public void typingPrivate(@DestinationVariable String recipient, Principal principal) {
    if (principal != null) {
      String username = principal.getName();
      messagingTemplate.convertAndSendToUser(recipient, "/queue/typing", Map.of("from", username));
    }
  }

  @MessageMapping("/sendPrivateMessage/{recipient}")
  public void sendPrivateMessage(@DestinationVariable String recipient,
                                 @Payload Message message,
                                 Principal principal) {
    if (principal == null) {
      throw new NotPermittedException("Unauthorized");
    }
    String username = principal.getName();
    messageService.processDirectMessage(username, recipient, message)
            .thenAccept(savedMessage -> {
              // Send message to recipient
              messagingTemplate.convertAndSendToUser(recipient, "/queue/messages", savedMessage);
              
              // Send message back to sender for confirmation
              messagingTemplate.convertAndSendToUser(username, "/queue/messages", savedMessage);
            });
  }

  @MessageMapping("/signal/{channel}")
  public void signal(@DestinationVariable String channel,
                     @Payload SignalMessageDTO msg,
                     Principal principal) {
    String username = principal.getName();
    msg.setFrom(username);


    if ("join".equalsIgnoreCase(msg.getType())) {
      callService.userJoined(channel, username);
    }
    else if ("leave".equalsIgnoreCase(msg.getType())) {
      callService.userLeft(channel, username);
    }
    messagingTemplate.convertAndSend("/channel/" + channel + "/signal", msg);
  }

  @MessageMapping("/seen")
  public void handleSeen(SeenReceiptDTO seenReceipt, Principal principal) {
    messageService.handleSeen(principal.getName(), seenReceipt);
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
