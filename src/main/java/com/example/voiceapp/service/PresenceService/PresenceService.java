package com.example.voiceapp.service.PresenceService;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

public interface PresenceService {

    CompletableFuture<Void> setUserStatus(String username, boolean isOnline);
    CompletableFuture<Map<String, Boolean>> getPresenceMap();
}
