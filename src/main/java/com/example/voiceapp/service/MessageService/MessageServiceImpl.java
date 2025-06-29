package com.example.voiceapp.service.MessageService;

import com.amazonaws.services.kms.model.NotFoundException;
import com.example.voiceapp.Enum.NotificationType;
import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.collection.Message;
import com.example.voiceapp.collection.User;
import com.example.voiceapp.dtos.NotificationDTO;
import com.example.voiceapp.dtos.SeenReceiptDTO;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.exceptions.NotPermittedException;
import com.example.voiceapp.repository.ChannelRepository;
import com.example.voiceapp.repository.MessageRepository;
import com.example.voiceapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import static java.util.concurrent.CompletableFuture.supplyAsync;

@Service
public class MessageServiceImpl implements MessageService {
  private static final Pattern MENTION_PATTERN = Pattern.compile("@(\\w+)");

  @Autowired private MessageRepository messageRepository;
  @Autowired private UserRepository userRepository;
  @Autowired private ChannelRepository channelRepository;
  @Autowired private SimpMessagingTemplate messagingTemplate;
  @Override
  public CompletableFuture<Message> processChannelMessage(String sender, String channel, Message message) {
    return supplyAsync(() -> {
      Channel c = channelRepository.findByVanityId(channel)
              .orElseThrow(() -> new NonExistentException("Channel not found"));

      if (!c.getMembers().containsKey(sender)) {
        throw new NotPermittedException("You are not allowed to send a message in this channel.");
      }
      if (c.getMutedMembers().containsKey(sender) && c.getMutedMembers().get(sender).after(new Date())) {
        NotificationDTO mentionNotification = new NotificationDTO(
                NotificationType.MESSAGE,
                "You are muted until "+c.getMutedMembers().get(sender)
        );
        messagingTemplate.convertAndSendToUser(
                sender,
                "/queue/notifications",
                mentionNotification
        );
        throw new NotPermittedException("You are muted until " + c.getMutedMembers().get(sender));
      }

      message.setSender(sender);
      message.setChannel(channel);
      message.setRecipient(null);
      message.setDate(new Date());

      Set<String> mentionedUsernames = findMentionedUsers(message.getContent());
      if (!mentionedUsernames.isEmpty()) {
        System.out.println("Mentioned: " + mentionedUsernames);
        Set<String> validMentions = mentionedUsernames.stream()
                .filter(username -> !username.equals(sender))
                .filter(username -> userRepository.findByUsername(username).isPresent())
                .filter(username -> c.getMembers().containsKey(username))
                .collect(Collectors.toSet());

        message.setMentions(validMentions);

        validMentions.forEach(mentionedUser -> {
          NotificationDTO mentionNotification = new NotificationDTO(
                  NotificationType.MENTION,
                  sender + " mentioned you in #" + c.getVanityId()
          );
          System.out.println("Mentioned: " + mentionedUser);
          messagingTemplate.convertAndSendToUser(
                  mentionedUser,
                  "/queue/notifications",
                  mentionNotification
          );
        });
      }

      messageRepository.save(message);
      return message;
    });
  }
  private Set<String> findMentionedUsers(String content) {
    Set<String> mentions = new HashSet<>();
    if (content == null) return mentions;

    Matcher matcher = MENTION_PATTERN.matcher(content);
    while (matcher.find()) {
      mentions.add(matcher.group(1));
    }
    return mentions;
  }
  @Override
  public CompletableFuture<Message> processDirectMessage(String sender, String recipient, Message message) {
    return supplyAsync(() -> {
      if (!userRepository.existsByUsername(recipient)) {
        throw new NonExistentException("Recipient does not exist");
      }

      User senderUser = userRepository.findByUsernameIgnoreCase(sender)
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

  @Override
  public CompletableFuture<List<Message>> fetchMessageByDM(String sender, String recipient, Integer limit){
    return supplyAsync(() -> {
      System.out.println(recipient);
      if (!userRepository.existsByUsername(recipient)) {
        throw new NonExistentException("Recipient does not exist");
      }

      User senderUser = userRepository.findByUsernameIgnoreCase(sender)
              .orElseThrow(() -> new NonExistentException("Sender not found"));

      if (!senderUser.getFriends().contains(recipient)) {
        throw new NotPermittedException("Cannot send DM to non-friend.");
      }

      Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "date"));

      // Fetch messages in both directions of the conversation
      return messageRepository.findAllByConversation(sender, recipient, pageable)
              .stream()
              .sorted(Comparator.comparing(Message::getDate))
              .collect(Collectors.toList());
    });
  }

  @Override
  public void handleSeen(String reader, SeenReceiptDTO seenReceipt) {
    if(!userRepository.existsByUsername(reader)) {
      throw new NonExistentException("Reader doesn't exist");
    }
    String senderName = null;
    User u = userRepository.findByUsernameIgnoreCase(reader).orElseThrow(()-> new NotFoundException("User not found"));
    List<Message> messages = new ArrayList<>();
    if(seenReceipt.getChannelId() != null) {
      Channel c = channelRepository.findByVanityId(seenReceipt.getChannelId()).orElseThrow(()-> new NotFoundException("Channel doesn't exist"));
      if(!c.getMembers().containsKey(u.getUsername())) {
        throw new NotPermittedException("Cannot see messages from channels you're not a member of.");
      }
    }
    if(seenReceipt.getRecipientId()!=null){
      User sender = userRepository.findByUsernameIgnoreCase(seenReceipt.getRecipientId()).orElseThrow(()->new NonExistentException("User not found"));
      if(!sender.getFriends().contains(u.getUsername())) {
        throw new NotPermittedException("Cannot see messages from senders you're not friends with.");
      }
      senderName = sender.getUsername();
    }
    for(String ids : seenReceipt.getMessageIds()){
      messageRepository.findById(ids).ifPresent(m -> {
        boolean isSeen = m.getSeenBy().add(u.getUsername());
        if(isSeen){
          messageRepository.save(m);
          messages.add(m);
        }
      });
    }
    if(!messages.isEmpty()){
      if(seenReceipt.getChannelId()!=null){
        messagingTemplate.convertAndSend("/channel/"+seenReceipt.getChannelId(), messages);
      }
      else if(senderName!=null){
        messagingTemplate.convertAndSendToUser(u.getUsername(), "/queue/messages",messages);
        messagingTemplate.convertAndSendToUser(senderName, "/queue/messages", messages);
      }
    }
  }
}
