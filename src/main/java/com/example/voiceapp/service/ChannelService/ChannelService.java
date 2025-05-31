package com.example.voiceapp.service.ChannelService;

import com.example.voiceapp.dtos.ChannelDTO;
import com.example.voiceapp.dtos.CreateInviteDTO;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public interface ChannelService {

  CompletableFuture<Map<String, String>> createChannel(ChannelDTO channel) throws IOException;

  CompletableFuture<Map<String, String>> createInvite(CreateInviteDTO createInviteDTO);

  CompletableFuture<Map<String, String>> joinChannel(String inviteCode);
}
