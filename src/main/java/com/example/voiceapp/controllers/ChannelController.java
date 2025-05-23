package com.example.voiceapp.controllers;

import com.example.voiceapp.dtos.ChannelDTO;
import com.example.voiceapp.dtos.CreateInviteDTO;
import com.example.voiceapp.dtos.InviteDTO;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.service.ChannelService.ChannelService;
import java.io.IOException;
import java.util.Map;

import com.example.voiceapp.service.ChannelService.ChannelServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.async.DeferredResult;

@RestController
@RequestMapping("/api/channel")
public class ChannelController {
  @Autowired private ChannelServiceImpl channelService;

  @PostMapping(path = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  @CrossOrigin(origins = "*", allowedHeaders = "*", exposedHeaders = "Content-Disposition")
  public DeferredResult<ResponseEntity<Map<String, String>>> createChannel(@ModelAttribute ChannelDTO channelDTO) throws IOException {
    DeferredResult<ResponseEntity<Map<String, String>>> output = new DeferredResult<>();
    channelService.createChannel(channelDTO).thenAccept(result ->
            output.setResult(new ResponseEntity<>(result, HttpStatus.CREATED))
    ).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(Map.of("Error", ex.getMessage())));
      return null;
    });
    return output;
  }

  @PostMapping("/create-invite")
  @ResponseStatus(HttpStatus.CREATED)
  public DeferredResult<ResponseEntity<Map<String, String>>> createInvite(@RequestBody CreateInviteDTO createInviteDTO) {
    DeferredResult<ResponseEntity<Map<String, String>>> output = new DeferredResult<>();
    channelService.createInvite(createInviteDTO).thenAccept(result ->
            output.setResult(new ResponseEntity<>(result, HttpStatus.CREATED))
    ).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(Map.of("Error", ex.getMessage())));
      return null;
    });
    return output;
  }

  @PostMapping("/join/{invite}")
  @ResponseStatus(HttpStatus.CREATED)
  public DeferredResult<ResponseEntity<Map<String, String>>> joinChannel(@PathVariable String invite) {
    DeferredResult<ResponseEntity<Map<String, String>>> output = new DeferredResult<>();
    channelService.joinChannel(invite).thenAccept(result ->
            output.setResult(new ResponseEntity<>(result, HttpStatus.CREATED))
    ).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(Map.of("Error", ex.getMessage())));
      return null;
    });
    return output;
  }

  @ExceptionHandler(AlreadyExistsException.class)
  public ResponseEntity<Map<String, String>> handleAlreadyExistsException(AlreadyExistsException e) {
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
