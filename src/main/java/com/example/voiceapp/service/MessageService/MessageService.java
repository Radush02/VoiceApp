package com.example.voiceapp.service.MessageService;

import com.example.voiceapp.collection.Message;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.repository.ChannelRepository;
import com.example.voiceapp.repository.MessageRepository;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
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
  public Message saveMessage(Message message) {
    if (!channelRepository.existsByVanityId(message.getChannel())) {
      throw new NonExistentException("Channel doesn't exist!");
    }
    message.setDate(new Date());
    return messageRepository.save(message);
  }

  @Override
  public List<Message> fetchMessagesByChannel(String channel, Integer limit) {
    if (!channelRepository.existsByVanityId(channel)) {
      throw new NonExistentException("Channel doesn't exist!");
    }
    Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "date"));
    return messageRepository.findAllByChannel(channel, pageable).stream()
        .sorted(Comparator.comparing(Message::getDate))
        .collect(Collectors.toList());
  }
}
