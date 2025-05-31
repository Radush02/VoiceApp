package com.example.voiceapp.controllers;

import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.dtos.*;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.service.PresenceService.PresenceService;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

import com.example.voiceapp.service.UserService.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.async.DeferredResult;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/user")
public class UserController {

  @Autowired private UserService userService;
  @Autowired private PresenceService presenceService;
  @GetMapping("/getChannels")
  public DeferredResult<ResponseEntity<Map<String, Set<Channel>>>> getChannels() {
    DeferredResult<ResponseEntity<Map<String, Set<Channel>>>> output = new DeferredResult<>();
    userService.getChannels().thenAccept(channels ->
            output.setResult(new ResponseEntity<>(Map.of("channels", channels), HttpStatus.OK))
    ).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(Map.of("Error", ex.getMessage())));
      return null;
    });
    return output;
  }

  @GetMapping("/getRequests")
  public DeferredResult<ResponseEntity<Map<String, Set<String>>>> getRequests() {
    DeferredResult<ResponseEntity<Map<String, Set<String>>>> output = new DeferredResult<>();
    userService.getRequests().thenAccept(requests ->
            output.setResult(new ResponseEntity<>(Map.of("requests", requests), HttpStatus.OK))
    ).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(Map.of("Error", ex.getMessage())));
      return null;
    });
    return output;
  }

  @PostMapping("/sendRequest")
  public DeferredResult<ResponseEntity<Map<String, String>>> sendRequest(@RequestBody SendRequestDTO requestDTO) {
    DeferredResult<ResponseEntity<Map<String, String>>> output = new DeferredResult<>();
    userService.sendRequest(requestDTO).thenAccept(response ->
            output.setResult(new ResponseEntity<>(response, HttpStatus.OK))
    ).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(Map.of("Error", ex.getMessage())));
      return null;
    });
    return output;
  }

  @PostMapping("/processRequest")
  public DeferredResult<ResponseEntity<Map<String, String>>> processRequest(@RequestBody ProcessFriendRequestDTO requestDTO) {
    DeferredResult<ResponseEntity<Map<String, String>>> output = new DeferredResult<>();
    userService.processRequest(requestDTO).thenAccept(response ->
            output.setResult(new ResponseEntity<>(response, HttpStatus.OK))
    ).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(Map.of("Error", ex.getMessage())));
      return null;
    });
    return output;
  }

  @PostMapping("/upload")
  @CrossOrigin(origins = "*", allowedHeaders = "*", exposedHeaders = "Content-Disposition")
  public DeferredResult<ResponseEntity<Map<String, String>>> upload(@RequestParam("file") MultipartFile file) throws IOException {
    DeferredResult<ResponseEntity<Map<String, String>>> output = new DeferredResult<>();
    userService.uploadProfilePicture(file).thenAccept(response ->
            output.setResult(new ResponseEntity<>(response, HttpStatus.OK))
    ).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(Map.of("Error", ex.getMessage())));
      return null;
    });
    return output;
  }

  @GetMapping("/info")
  public DeferredResult<ResponseEntity<UserDTO>> getUser() {
    DeferredResult<ResponseEntity<UserDTO>> output = new DeferredResult<>();
    userService.getUser().handle((userDTO, ex) -> {
      if (!output.isSetOrExpired()) {
        if (ex != null) {
          String msg = ex.getCause()!=null
                  ? ex.getCause().getMessage()
                  : ex.getMessage();
          output.setErrorResult(new RuntimeException(msg));
        } else {
          output.setResult(new ResponseEntity<>(userDTO, HttpStatus.OK));
        }
      }
      return null;
    });
    return output;
  }



  @GetMapping("/info/{user}")
  public DeferredResult<ResponseEntity<PublicUserDTO>> getPublicUser(@PathVariable String user) {
    DeferredResult<ResponseEntity<PublicUserDTO>> output = new DeferredResult<>();
    userService.getPublicUser(user).thenAccept(publicUserDTO ->
            output.setResult(new ResponseEntity<>(publicUserDTO, HttpStatus.OK))
    ).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(null));
      return null;
    });
    return output;
  }

  @PostMapping("/update/aboutme")
  public DeferredResult<ResponseEntity<Map<String, String>>> aboutMe(@RequestBody SingleInputDTO input) {
    DeferredResult<ResponseEntity<Map<String, String>>> output = new DeferredResult<>();
    userService.updateAboutMe(input).thenAccept(response ->
            output.setResult(new ResponseEntity<>(response, HttpStatus.OK))
    ).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(Map.of("Error", ex.getMessage())));
      return null;
    });
    return output;
  }

  @PostMapping("/update/status")
  public DeferredResult<ResponseEntity<Map<String, String>>> updateStatus(@RequestBody SingleInputDTO input) {
    DeferredResult<ResponseEntity<Map<String, String>>> output = new DeferredResult<>();
    userService.updateStatus(input).thenAccept(response ->
            output.setResult(new ResponseEntity<>(response, HttpStatus.OK))
    ).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(Map.of("Error", ex.getMessage())));
      return null;
    });
    return output;
  }
  @GetMapping("/presence")
  public DeferredResult<ResponseEntity<Map<String, Boolean>>> getPresence() {
    DeferredResult<ResponseEntity<Map<String, Boolean>>> output = new DeferredResult<>();
    presenceService.getPresenceMap().thenAccept(map ->
            output.setResult(new ResponseEntity<>(map, HttpStatus.OK))
    ).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null));
      return null;
    });
    return output;
  }

  @GetMapping("/friends")
  public DeferredResult<ResponseEntity<Map<String, Set<String>>>> getFriends() {
    DeferredResult<ResponseEntity<Map<String, Set<String>>>> output = new DeferredResult<>();
    userService.getFriends().thenAccept(friends ->
            output.setResult(new ResponseEntity<>(friends, HttpStatus.OK))
    ).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(Map.of("Error", ex.getMessage())));
      return null;
    });
    return output;
  }

  @GetMapping("/friends/{friend}")
  public DeferredResult<ResponseEntity<Map<String, Boolean>>> areFriends(@PathVariable String friend) {
    DeferredResult<ResponseEntity<Map<String, Boolean>>> output = new DeferredResult<>();
    userService.areFriends(friend).thenAccept(
            f -> output.setResult(new ResponseEntity<>(f,HttpStatus.OK))
    ).exceptionally(
            ex -> {
              output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                      .body(Map.of("Error", ex.getMessage())));
              return null;
            });
    return output;
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
