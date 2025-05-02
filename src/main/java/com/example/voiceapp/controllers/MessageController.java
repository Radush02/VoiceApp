package com.example.voiceapp.controllers;

import com.example.voiceapp.collection.Message;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.exceptions.NotPermittedException;
import com.example.voiceapp.service.MessageService.MessageService;
import com.example.voiceapp.service.MessageService.MessageServiceImpl;
import com.example.voiceapp.service.S3Service.S3Service;
import java.io.IOException;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

import com.example.voiceapp.service.S3Service.S3ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.async.DeferredResult;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

  @Autowired private MessageServiceImpl messageService;
  @Autowired private S3ServiceImpl s3Service;

  @GetMapping("/{channel}")
  public DeferredResult<ResponseEntity<List<Message>>> getMessages(
          @PathVariable String channel,
          @RequestParam(required = false, defaultValue = "20") Integer limit) {

    DeferredResult<ResponseEntity<List<Message>>> output = new DeferredResult<>();
    messageService.fetchMessagesByChannel(channel, limit).thenAccept(messages ->
            output.setResult(new ResponseEntity<>(messages, HttpStatus.OK))
    ).exceptionally(ex -> {
      output.setErrorResult(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(null));
      return null;
    });
    return output;
  }

  @GetMapping("/private/{recipient}")
  public DeferredResult<ResponseEntity<List<Message>>> getMessagesByRecipient(
          @PathVariable String recipient,
          @RequestParam(defaultValue="20") Integer limit,
          Principal principal) {

    if (principal==null) {
      DeferredResult<ResponseEntity<List<Message>>> dr = new DeferredResult<>();
      dr.setErrorResult(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
      return dr;
    }

    String sender = principal.getName();
    DeferredResult<ResponseEntity<List<Message>>> output = new DeferredResult<>();
    messageService.fetchMessageByDM(sender, recipient, limit)
            .thenAccept(messages -> output.setResult(ResponseEntity.ok(messages)))
            .exceptionally(ex -> {
              Throwable cause = ex instanceof CompletionException&&ex.getCause()!=null?ex.getCause():ex;
              output.setErrorResult(cause);
              return null;
            });
    return output;
  }


  @PostMapping("/upload/{channel}")
  @CrossOrigin(origins = "*", allowedHeaders = "*", exposedHeaders = "Content-Disposition")
  public DeferredResult<ResponseEntity<Map<String, String>>> upload(
          @PathVariable String channel, @RequestParam("file") MultipartFile file) throws IOException {

    DeferredResult<ResponseEntity<Map<String, String>>> output = new DeferredResult<>();

    if (file.isEmpty()) {
      output.setErrorResult(ResponseEntity.status(HttpStatus.BAD_REQUEST)
              .body(Map.of("Error", "File is empty")));
      return output;
    }

    String fileName = channel + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();

    s3Service.uploadFile(fileName, file)
            .thenApply(url -> ResponseEntity.ok(Map.of("message", url)))
            .thenAccept(output::setResult)
            .exceptionally(ex -> {
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
