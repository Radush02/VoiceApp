package com.example.voiceapp.service.ChannelService;

import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.dtos.ChannelDTO;

import java.util.concurrent.CompletableFuture;

public interface ChannelServiceImpl {

  CompletableFuture<Channel> createChannel(ChannelDTO channel);

}
