package com.example.voiceapp.service.MessageService;

import com.example.voiceapp.collection.Message;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.repository.ChannelRepository;
import com.example.voiceapp.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MessageService implements MessageServiceImpl {
  @Autowired private MessageRepository messageRepository;

  @Autowired private ChannelRepository channelRepository;

  @Override
  public Message saveMessage(Message message) {
    if (!channelRepository.existsByVanityId(message.getChannel())) {
      throw new NonExistentException("Channel doesn't exist!");
    }

    return messageRepository.save(message);
  }
}
