package com.example.voiceapp.service.UserService;

import com.example.voiceapp.collection.Channel;

import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

public interface UserServiceImpl {
    
    CompletableFuture<Set<Channel>> getChannels();
    CompletableFuture<Set<String>> getRequests();
}
