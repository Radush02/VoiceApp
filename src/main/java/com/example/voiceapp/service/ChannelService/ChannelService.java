package com.example.voiceapp.service.ChannelService;

import com.example.voiceapp.dtos.ChannelDTO;
import com.example.voiceapp.dtos.CreateInviteDTO;
import com.example.voiceapp.dtos.UserDTO;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

public interface ChannelService {

  CompletableFuture<Map<String, String>> createChannel(ChannelDTO channel) throws IOException;

  CompletableFuture<Map<String, String>> createInvite(CreateInviteDTO createInviteDTO);

  CompletableFuture<Map<String, String>> joinChannel(String inviteCode);
  CompletableFuture<Set<UserDTO>> getUsers(String channel);
}
