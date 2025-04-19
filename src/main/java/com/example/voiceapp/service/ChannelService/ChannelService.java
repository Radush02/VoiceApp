package com.example.voiceapp.service.ChannelService;

import com.example.voiceapp.Enum.Role;
import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.collection.ChannelMembership;
import com.example.voiceapp.collection.Invite;
import com.example.voiceapp.collection.User;
import com.example.voiceapp.dtos.ChannelDTO;
import com.example.voiceapp.dtos.CreateInviteDTO;
import com.example.voiceapp.dtos.InviteDTO;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.exceptions.NotPermittedException;
import com.example.voiceapp.repository.ChannelRepository;
import com.example.voiceapp.repository.InviteRepository;
import com.example.voiceapp.repository.UserRepository;
import com.example.voiceapp.service.AuthService.AuthService;

import java.io.IOException;
import java.util.Date;
import java.util.HashSet;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import com.example.voiceapp.service.S3Service.S3Service;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ChannelService implements ChannelServiceImpl {

  @Autowired private ChannelRepository channelRepository;
  @Autowired private UserRepository userRepository;
  @Autowired private AuthService authService;
  @Autowired private InviteRepository inviteRepository;
  @Autowired private S3Service s3Service;

  @Override
  public CompletableFuture<Map<String, String>> createChannel(ChannelDTO channel) throws IOException {
    User u =
        userRepository
            .findByUsername(authService.extractUsername())
            .orElseThrow(() -> new NonExistentException("User not found"));
    if (channelRepository.existsByName(channel.getName())) {
      throw new AlreadyExistsException(
          "Channel with name " + channel.getName() + " already exists");
    }
    Channel newChannel = new Channel();
    newChannel.setName(channel.getName());
    newChannel.setVanityId(channel.getVanityId());
    newChannel.setCreatedBy(authService.extractUsername());
    newChannel.getMembers().add(authService.extractUsername());
    u.getChannels().add(new ChannelMembership(newChannel.getVanityId(), Role.ADMIN,new Date()));
    String fileName = channel.getVanityId() + "." + StringUtils.getFilenameExtension(channel.getFile().getOriginalFilename());
    System.out.println(fileName);
    newChannel.setImageLink(s3Service.uploadFile(fileName, channel.getFile()));
    channelRepository.save(newChannel);
    userRepository.save(u);
    System.out.println("done");
    return CompletableFuture.completedFuture(Map.of("Created", newChannel.getVanityId()));
  }

  public CompletableFuture<Map<String, String>> joinChannel(InviteDTO inviteDTO) {
    String currentUser = authService.extractUsername();

    Invite invite =
        inviteRepository
            .findById(inviteDTO.getInviteId())
            .orElseThrow(() -> new NonExistentException("Invite not found"));

    if (invite.getExpiresAt() != null && invite.getExpiresAt().before(new Date())) {
      throw new NotPermittedException("This invite has expired.");
    }

    if (invite.getMaxUses() != null
        && invite.getUses() != null
        && invite.getUses() >= invite.getMaxUses()) {
      throw new NotPermittedException(
          "This invite has already been used the maximum number of times.");
    }

    User user =
        userRepository
            .findByUsername(currentUser)
            .orElseThrow(() -> new NonExistentException("User not found"));
    Channel channel =
        channelRepository
            .findByVanityId(invite.getVanityId())
            .orElseThrow(() -> new NonExistentException("Channel not found"));

    boolean alreadyInChannel =
        user.getChannels().stream().anyMatch(cm -> cm.getVanityId().equals(channel.getVanityId()));
    if (alreadyInChannel) {
      return CompletableFuture.completedFuture(Map.of("Server", channel.getVanityId()));
    }

    user.getChannels().add(new ChannelMembership(channel.getVanityId(), Role.USER,new Date()));
    userRepository.save(user);

    if (channel.getMembers() == null) {
      channel.setMembers(new HashSet<>());
    }
    channel.getMembers().add(user.getUsername());
    channelRepository.save(channel);

    if (invite.getUses() == null) {
      invite.setUses(1);
    } else {
      invite.setUses(invite.getUses() + 1);
    }
    inviteRepository.save(invite);

    return CompletableFuture.completedFuture(Map.of("Server", channel.getVanityId()));
  }

  public CompletableFuture<Map<String, String>> createInvite(CreateInviteDTO createInviteDTO) {
    User u =
        userRepository
            .findByUsername(authService.extractUsername())
            .orElseThrow(() -> new NonExistentException("User not found"));
    boolean isAdmin =
        u.getChannels().stream()
            .anyMatch(
                cm ->
                    cm.getVanityId().equals(createInviteDTO.getVanityId())
                        && cm.getRole() == Role.ADMIN);
    if (!isAdmin) {
      throw new NotPermittedException("Only admins can create invite links.");
    }
    String inviteId = RandomStringUtils.randomAlphanumeric(10);
    while (inviteRepository.existsById(inviteId)) {
      inviteId = RandomStringUtils.randomAlphanumeric(10);
    }
    Invite invite = new Invite();
    invite.setId(inviteId);
    invite.setVanityId(createInviteDTO.getVanityId());
    invite.setCreatedBy(authService.extractUsername());
    invite.setCreatedAt(new Date());
    if (createInviteDTO.getExpiresInMinutes() != null) {
      long expiresInMS = createInviteDTO.getExpiresInMinutes() * 60L * 1000L;
      invite.setExpiresAt(new Date(new Date().getTime() + expiresInMS));
    }
    if (createInviteDTO.getMaxUses() != null) {
      invite.setMaxUses(createInviteDTO.getMaxUses());
    }
    inviteRepository.save(invite);
    return CompletableFuture.completedFuture(Map.of("Server", inviteId));
  }
}
