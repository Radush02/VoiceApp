package com.example.voiceapp.controllers;

import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.dtos.ChannelDTO;
import com.example.voiceapp.dtos.InviteDTO;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.service.ChannelService.ChannelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/channel")
public class ChannelController {
  @Autowired private ChannelService channelService;

  @PostMapping("/create")
  @ResponseStatus(HttpStatus.CREATED)
  public ResponseEntity<Channel> createChannel(@RequestBody ChannelDTO channelDTO) throws ExecutionException, InterruptedException {
    CompletableFuture<Channel> ch = channelService.createChannel(channelDTO);
    return new ResponseEntity<>(ch.get(), HttpStatus.CREATED);
  }

  @PostMapping("/join")
  @ResponseStatus(HttpStatus.CREATED)
  public ResponseEntity<Map<String,String>> joinChannel(@RequestBody InviteDTO inviteDTO) throws ExecutionException, InterruptedException {
    CompletableFuture<Map<String,String>> join = channelService.joinChannel(inviteDTO);
    return new ResponseEntity<>(join.get(),HttpStatus.CREATED);

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
