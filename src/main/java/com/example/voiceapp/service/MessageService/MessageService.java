package com.example.voiceapp.service.MessageService;

import com.example.voiceapp.collection.Message;
import org.springframework.scheduling.annotation.Async;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface MessageService {


  @Async
  CompletableFuture<Message> processChannelMessage(String sender, String channel, Message message);

  @Async
  CompletableFuture<Message> processDirectMessage(String sender, String recipient, Message message);

  CompletableFuture<List<Message>> fetchMessagesByChannel(String channel, Integer limit);

  CompletableFuture<List<Message>> fetchMessageByDM(String sender, String recipient, Integer limit);
}
