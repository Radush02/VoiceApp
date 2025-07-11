package com.example.voiceapp.service.ChannelService;

import com.example.voiceapp.dtos.*;

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

  CompletableFuture<Map<String, String>> handleAdminAction(AdminActionDTO action);

  CompletableFuture<GetChannelDTO> getChannel(String vanityId);

  CompletableFuture<Map<String,Boolean>> inServer(InServerDTO inServerDTO);

  CompletableFuture<Map<String,String>> getServerFromInvite(String inviteCode);
}
