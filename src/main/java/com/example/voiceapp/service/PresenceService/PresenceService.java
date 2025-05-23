package com.example.voiceapp.service.PresenceService;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService implements PresenceServiceImpl {
    private final Map<String, Boolean> onlineUsers = new ConcurrentHashMap<>();

    @Autowired private SimpMessagingTemplate messagingTemplate;

    public CompletableFuture<Void> setUserStatus(String username, boolean isOnline) {
        onlineUsers.put(username, isOnline);
        broadcastPresence();
        return CompletableFuture.completedFuture(null);
    }

    public CompletableFuture<Map<String, Boolean>> getPresenceMap() {
        return CompletableFuture.completedFuture(onlineUsers);
    }

    private void broadcastPresence() {
        messagingTemplate.convertAndSend("/topic/presence", onlineUsers);
    }
}
