package com.example.voiceapp.service.MessageService;

import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.collection.Message;
import com.example.voiceapp.collection.User;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.exceptions.NotPermittedException;
import com.example.voiceapp.repository.ChannelRepository;
import com.example.voiceapp.repository.MessageRepository;
import com.example.voiceapp.repository.UserRepository;
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

import static java.util.concurrent.CompletableFuture.supplyAsync;

@Service
public class MessageService implements MessageServiceImpl {

  @Autowired private MessageRepository messageRepository;
  @Autowired private UserRepository userRepository;
  @Autowired private ChannelRepository channelRepository;

  @Override
  public CompletableFuture<Message> processChannelMessage(String sender, String channel, Message message) {
    return supplyAsync(() -> {
      Channel c = channelRepository.findByVanityId(channel)
              .orElseThrow(() -> new NonExistentException("Channel not found"));

      if (!c.getMembers().contains(sender)) {
        throw new NotPermittedException("You are not allowed to send a message in this channel.");
      }

      message.setSender(sender);
      message.setChannel(channel);
      message.setRecipient(null);
      message.setDate(new Date());
      messageRepository.save(message);
      return message;
    });
  }

  @Override
  public CompletableFuture<Message> processDirectMessage(String sender, String recipient, Message message) {
    return supplyAsync(() -> {
      if (!userRepository.existsByUsername(recipient)) {
        throw new NonExistentException("Recipient does not exist");
      }

      User senderUser = userRepository.findByUsername(sender)
              .orElseThrow(() -> new NonExistentException("Sender not found"));

      if (!senderUser.getFriends().contains(recipient)) {
        throw new NotPermittedException("Cannot send DM to non-friend.");
      }

      message.setSender(sender);
      message.setRecipient(recipient);
      message.setChannel(null);
      message.setDate(new Date());
      messageRepository.save(message);
      return message;
    });
  }

  @Override
  public CompletableFuture<List<Message>> fetchMessagesByChannel(String channel, Integer limit) {
    return supplyAsync(() -> {
      if (!channelRepository.existsByVanityId(channel)) {
        throw new NonExistentException("Channel doesn't exist!");
      }
      Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "date"));
      return messageRepository.findAllByChannel(channel, pageable).stream()
              .sorted(Comparator.comparing(Message::getDate))
              .collect(Collectors.toList());
    });
  }
}
