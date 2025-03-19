package com.example.voiceapp.service.MessageService;

import com.example.voiceapp.collection.Message;
import java.util.List;

public interface MessageServiceImpl {

  /**
   * @param message Obiect de tip mesaj. Vezi /collection/Message pentru structura.
   * @return Acelasi obiect de tip mesaj.
   */
  Message saveMessage(Message message);

  List<Message> fetchMessagesByChannel(String channel, Integer limit);
}
