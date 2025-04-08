package com.example.voiceapp.controllers;

import com.example.voiceapp.collection.Message;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.service.MessageService.MessageService;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

  @Autowired private MessageService messageService;

  @GetMapping("/{channel}")
  public ResponseEntity<List<Message>> getMessages(
      @PathVariable String channel,
      @RequestParam(required = false, defaultValue = "20") Integer limit) throws ExecutionException, InterruptedException {
    CompletableFuture<List<Message>> messages = messageService.fetchMessagesByChannel(channel, limit);
    return new ResponseEntity<>(messages.get(), HttpStatus.OK);
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
