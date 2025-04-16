package com.example.voiceapp.service.ChannelService;

import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.dtos.ChannelDTO;
import com.example.voiceapp.dtos.CreateInviteDTO;
import com.example.voiceapp.dtos.InviteDTO;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

public interface ChannelServiceImpl {

  CompletableFuture<Map<String,String>> createChannel(ChannelDTO channel);
  CompletableFuture<Map<String,String>> createInvite(CreateInviteDTO createInviteDTO);
  CompletableFuture<Map<String,String>> joinChannel(InviteDTO inviteDTO);
}
