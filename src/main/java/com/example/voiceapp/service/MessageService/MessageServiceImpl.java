package com.example.voiceapp.service.MessageService;

import com.example.voiceapp.collection.Message;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface MessageServiceImpl {

  /**
   * @param message Obiect de tip mesaj. Vezi /collection/Message pentru structura.
   * @return Acelasi obiect de tip mesaj.
   */
  CompletableFuture<Message> saveMessage(Message message);

 CompletableFuture<List<Message>> fetchMessagesByChannel(String channel, Integer limit);
}
