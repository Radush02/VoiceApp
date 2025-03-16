package com.example.voiceapp.service.ChannelService;

import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.dtos.ChannelDTO;

public interface ChannelServiceImpl {

  Channel createChannel(ChannelDTO channel);
}
