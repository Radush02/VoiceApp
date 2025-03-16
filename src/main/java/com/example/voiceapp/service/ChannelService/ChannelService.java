package com.example.voiceapp.service.ChannelService;

import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.dtos.ChannelDTO;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.repository.ChannelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ChannelService implements ChannelServiceImpl {

  @Autowired private ChannelRepository channelRepository;

  @Override
  public Channel createChannel(ChannelDTO channel) {
    if (channelRepository.existsByName(channel.getName())) {
      throw new AlreadyExistsException(
          "Channel with name " + channel.getName() + " already exists");
    }
    Channel newChannel = new Channel();
    newChannel.setName(channel.getName());
    newChannel.setVanityId(channel.getVanityId());
    newChannel.setCreatedBy("Admin");
    return channelRepository.save(newChannel);
  }
}
