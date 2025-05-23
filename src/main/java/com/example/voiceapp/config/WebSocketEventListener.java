package com.example.voiceapp.config;

import java.util.Map;

import com.example.voiceapp.service.PresenceService.PresenceServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {

    @Autowired private PresenceServiceImpl presenceService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        if (event.getUser() != null) {
            String username = event.getUser().getName();
            System.out.println("CONNECTED: " + username);
            presenceService.setUserStatus(username, true);
        } else {
            System.out.println("NO PRINCIPAL in connect event");
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        Map<String, Object> attributes = sha.getSessionAttributes();
        if (attributes != null && attributes.containsKey("username")) {
            String username = attributes.get("username").toString();
            presenceService.setUserStatus(username, false);
        }
    }
}
