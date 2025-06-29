package com.example.voiceapp.controllers;

import com.amazonaws.Response;
import com.example.voiceapp.dtos.*;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;

import java.io.IOException;
import java.security.Principal;
import java.util.Map;
import java.util.Set;

import com.example.voiceapp.service.ChannelService.ChannelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.async.DeferredResult;

@RestController
@RequestMapping("/api/channel")
public class ChannelController {
  @Autowired private ChannelService channelService;

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
  @GetMapping("/getUsers/{server}")
  @ResponseStatus(HttpStatus.OK)
  public DeferredResult<ResponseEntity<Set<UserDTO>>> getUsers(@PathVariable String server) {
    DeferredResult<ResponseEntity<Set<UserDTO>>> output = new DeferredResult<>();
    channelService.getUsers(server).thenAccept(members ->
            output.setResult(new ResponseEntity<>(members, HttpStatus.OK))
    ).exceptionally(
            ex->{output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null));
              return null;}
    );
    return output;
  }
  @PostMapping("/admin/action")
  public DeferredResult<ResponseEntity<Map<String, String>>> handleAdminAction(@RequestBody AdminActionDTO action) {
    DeferredResult<ResponseEntity<Map<String, String>>> result = new DeferredResult<>();
    channelService.handleAdminAction(action)
            .thenAccept(response -> result.setResult(ResponseEntity.ok(response)))
            .exceptionally(ex -> {
              result.setErrorResult(
                      ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                              .body(Map.of("error", "Action failed: " + ex.getMessage()))
              );
              return null;
            });
    return result;
  }
  @GetMapping("/{vanityId}")
  @ResponseStatus(HttpStatus.OK)
  public DeferredResult<ResponseEntity<GetChannelDTO>> getChannel(@PathVariable String vanityId) {
    DeferredResult<ResponseEntity<GetChannelDTO>> output = new DeferredResult<>();
    channelService.getChannel(vanityId).thenAccept(response -> output.setResult(ResponseEntity.ok(response)))
            .exceptionally(ex->
            {output.
                    setErrorResult(
                            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).
                                    body(null));
            return null;});
    return output;
  }

  @GetMapping("inServer/{vanityId}")
  @ResponseStatus(HttpStatus.OK)
  public DeferredResult<ResponseEntity<Map<String,Boolean>>> getInServer(@PathVariable String vanityId, Principal principal) {
    DeferredResult<ResponseEntity<Map<String,Boolean>>> output = new DeferredResult<>();
    channelService.inServer(new InServerDTO(principal.getName(),vanityId)).thenAccept(response -> output.setResult(ResponseEntity.ok(response)))
            .exceptionally( ex->
            {
              output.setErrorResult(
                      ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null));
            return null;});
    return output;
  }
  @GetMapping("vanity/{inviteCode}")
  @ResponseStatus(HttpStatus.OK)
  public DeferredResult<ResponseEntity<Map<String, String>>> getVanity(@PathVariable String inviteCode) {
    DeferredResult<ResponseEntity<Map<String, String>>> output = new DeferredResult<>();
    channelService.getServerFromInvite(inviteCode).thenAccept(response -> output.setResult(ResponseEntity.ok(response)))
            .exceptionally( ex->
            {
              output.setErrorResult(
                      ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null));
              return null;});
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
