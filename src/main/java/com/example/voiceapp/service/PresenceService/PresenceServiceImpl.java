package com.example.voiceapp.service.PresenceService;

import com.example.voiceapp.collection.User;
import com.example.voiceapp.controllers.UserController;
import com.example.voiceapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceServiceImpl implements PresenceService {
    private final Map<String, Boolean> onlineUsers = new ConcurrentHashMap<>();
    @Autowired private SimpMessagingTemplate messagingTemplate;
    @Autowired private UserRepository userRepository;

    public CompletableFuture<Void> setUserStatus(String username, boolean isOnline) {
        onlineUsers.put(username, isOnline);
        User u = this.userRepository.findByUsername(username).orElse(null);
        if(isOnline && u != null && Objects.equals(u.getStatus(), "offline")) {
            u.setStatus("online");
        }
        else if(!isOnline && u != null && !Objects.equals(u.getStatus(), "offline")) {
            u.setStatus("offline");
        }
        assert u != null;
        userRepository.save(u);
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
