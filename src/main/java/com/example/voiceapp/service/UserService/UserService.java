package com.example.voiceapp.service.UserService;

import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.collection.ChannelMembership;
import com.example.voiceapp.collection.User;
import com.example.voiceapp.repository.ChannelRepository;
import com.example.voiceapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;


import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

@Service
public class UserService implements UserServiceImpl {

    @Autowired private UserRepository userRepository;
    @Autowired private ChannelRepository channelRepository;

    @Override
    public CompletableFuture<Set<Channel>> getChannels() {

        User currentUser = userRepository.findByUsername(SecurityContextHolder.getContext().getAuthentication().getName()).orElseThrow();
        Set<ChannelMembership> channels = currentUser.getChannels();
        Set<Channel> channelSet = new HashSet<>();
        for (ChannelMembership channel : channels) {
            channelSet.add(channelRepository.findByVanityId(channel.getVanityId()));
        }
        return CompletableFuture.completedFuture(channelSet);
    }
}
