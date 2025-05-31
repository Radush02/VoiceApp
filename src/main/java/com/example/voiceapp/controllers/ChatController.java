package com.example.voiceapp.controllers;


import com.example.voiceapp.collection.Message;

import com.example.voiceapp.dtos.SignalMessageDTO;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.exceptions.NotPermittedException;


import java.security.Principal;
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
    System.out.println(">>> [ChatController.GET /api/call/" + channel + "/status] returning active=" + active);
    return new ResponseEntity<>(Map.of("active", active), HttpStatus.OK);
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
    messageService.processDirectMessage(principal.getName(), recipient, message);
    messagingTemplate.convertAndSendToUser(recipient, "/queue/messages", message);
  }

  @MessageMapping("/signal/{channel}")
  public void signal(@DestinationVariable String channel,
                     @Payload SignalMessageDTO msg,
                     Principal principal) {
    String username = principal.getName();
    msg.setFrom(username);
    System.out.println(">>> [ChatController.signal] got SIGNAL on channel=" + channel
            + " from=" + username + ", type=" + msg.getType());

    if ("join".equalsIgnoreCase(msg.getType())) {
      System.out.println(">>> [ChatController] userJoined triggered for channel=" + channel + ", user=" + username);
      callService.userJoined(channel, username);
      System.out.println(">>> [CallService.activeCallers(" + channel + ")] = " + callService.getCurrentCallers(channel));
    }
    else if ("leave".equalsIgnoreCase(msg.getType())) {
      System.out.println(">>> [ChatController] userLeft for channel=" + channel + ", user=" + username);
      callService.userLeft(channel, username);
      System.out.println(">>> [CallService.activeCallers(" + channel + ")] = " + callService.getCurrentCallers(channel));
    }
    System.out.println(">>> [ChatController] broadcasting SIGNAL back to /channel/" + channel + "/signal → " + msg);
    messagingTemplate.convertAndSend("/channel/" + channel + "/signal", msg);
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
