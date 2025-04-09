package com.example.voiceapp.service.MessageService;

import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.collection.Message;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.repository.ChannelRepository;
import com.example.voiceapp.repository.MessageRepository;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class MessageService implements MessageServiceImpl {
  @Autowired private MessageRepository messageRepository;

  @Autowired private ChannelRepository channelRepository;

  @Override
  public CompletableFuture<Message> saveMessage(Message message) {
    Channel c = channelRepository.findByVanityId(message.getChannel()).orElseThrow(()->new NonExistentException("Channel not found"));
    if(!c.getMembers().contains(message.getSender())){
      throw new NonExistentException("You are not allowed to send a message in this channel.");
    }
    message.setDate(new Date());
    messageRepository.save(message);
    return CompletableFuture.completedFuture(message);
  }

  @Override
  public CompletableFuture<List<Message>> fetchMessagesByChannel(String channel, Integer limit) {
    if (!channelRepository.existsByVanityId(channel)) {
      throw new NonExistentException("Channel doesn't exist!");
    }
    Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "date"));
    return CompletableFuture.completedFuture(messageRepository.findAllByChannel(channel, pageable).stream()
            .sorted(Comparator.comparing(Message::getDate))
            .collect(Collectors.toList()));
  }
}
