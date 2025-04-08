package com.example.voiceapp.service.ChannelService;

import com.example.voiceapp.Enum.Role;
import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.collection.ChannelMembership;
import com.example.voiceapp.collection.User;
import com.example.voiceapp.dtos.ChannelDTO;
import com.example.voiceapp.dtos.InviteDTO;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.exceptions.NotPermittedException;
import com.example.voiceapp.repository.ChannelRepository;
import com.example.voiceapp.repository.UserRepository;
import com.example.voiceapp.service.AuthService.AuthService;
import com.example.voiceapp.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class ChannelService implements ChannelServiceImpl {

  @Autowired private ChannelRepository channelRepository;
  @Autowired private UserRepository userRepository;
  @Autowired private AuthService authService;

  @Override
  public CompletableFuture<Channel> createChannel(ChannelDTO channel) {
    if (channelRepository.existsByName(channel.getName())) {
      throw new AlreadyExistsException(
          "Channel with name " + channel.getName() + " already exists");
    }
    Channel newChannel = new Channel();
    newChannel.setName(channel.getName());
    newChannel.setVanityId(channel.getVanityId());
    newChannel.setCreatedBy(authService.extractUsername());
    channelRepository.save(newChannel);
    joinChannel(new InviteDTO(newChannel.getVanityId(),newChannel.getCreatedBy()),Role.ADMIN);
    return CompletableFuture.completedFuture(newChannel);
  }

  public CompletableFuture<Map<String,String>> joinChannel(InviteDTO inviteDTO) {
    joinChannel(inviteDTO,Role.USER);
    return CompletableFuture.completedFuture(Map.of("Server",inviteDTO.getVanityId()));
  }

  private CompletableFuture<Map<String,String>> joinChannel(InviteDTO inviteDTO, Role role) {
    User u = userRepository.findByUsername(inviteDTO.getUsername()).orElseThrow(()->new NonExistentException("User not found"));
    if(!authService.extractUsername().equals(inviteDTO.getUsername())) {
      throw new NotPermittedException("Name of the invited person doesn't match with yours.");
    }
    u.getChannels().add(new ChannelMembership(inviteDTO.getVanityId(),role));
    userRepository.save(u);
    return CompletableFuture.completedFuture(Map.of("Server",inviteDTO.getVanityId()));
  }
}
