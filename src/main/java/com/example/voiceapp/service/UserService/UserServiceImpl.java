package com.example.voiceapp.service.UserService;

import com.example.voiceapp.collection.Channel;

import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

public interface UserServiceImpl {

    public CompletableFuture<Set<Channel>> getChannels();
}
