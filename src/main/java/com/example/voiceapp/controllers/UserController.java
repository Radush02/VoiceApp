package com.example.voiceapp.controllers;

import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.dtos.ProcessFriendRequestDTO;
import com.example.voiceapp.dtos.PublicUserDTO;
import com.example.voiceapp.dtos.SendRequestDTO;
import com.example.voiceapp.dtos.UserDTO;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.service.UserService.UserService;
import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/user")
public class UserController {

  @Autowired private UserService userService;

  @GetMapping("/getChannels")
  public ResponseEntity<Map<String, Set<Channel>>> getChannels()
      throws ExecutionException, InterruptedException {
    return new ResponseEntity<>(Map.of("channels", userService.getChannels().get()), HttpStatus.OK);
  }

  @GetMapping("/getRequests")
  public ResponseEntity<Map<String, Set<String>>> getRequests()
      throws ExecutionException, InterruptedException {
    return new ResponseEntity<>(Map.of("requests", userService.getRequests().get()), HttpStatus.OK);
  }

  @PostMapping("/sendRequest")
  public ResponseEntity<Map<String, String>> sendRequest(@RequestBody SendRequestDTO requestDTO)
      throws ExecutionException, InterruptedException {
    return new ResponseEntity<>(userService.sendRequest(requestDTO).get(), HttpStatus.OK);
  }

  @PostMapping("/processRequest")
  public ResponseEntity<Map<String, String>> processRequest(
      @RequestBody ProcessFriendRequestDTO requestDTO)
      throws ExecutionException, InterruptedException {
    return new ResponseEntity<>(userService.processRequest(requestDTO).get(), HttpStatus.OK);
  }

  @PostMapping("/upload")
  @CrossOrigin(origins = "*", allowedHeaders = "*", exposedHeaders = "Content-Disposition")
  public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file)
      throws ExecutionException, InterruptedException, IOException {
    return new ResponseEntity<>(userService.uploadProfilePicture(file).get(), HttpStatus.OK);
  }
  @GetMapping("/info")
  public ResponseEntity<UserDTO> getUser() throws ExecutionException, InterruptedException {
    return new ResponseEntity<>(userService.getUser().get(),HttpStatus.OK);
  }
  @GetMapping("/info/{user}")
  public ResponseEntity<PublicUserDTO> getUser(@PathVariable String user) throws ExecutionException, InterruptedException {
    return new ResponseEntity<>(userService.getPublicUser(user).get(),HttpStatus.OK);
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
