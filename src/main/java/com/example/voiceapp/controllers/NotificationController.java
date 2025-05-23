package com.example.voiceapp.controllers;

import com.example.voiceapp.dtos.NotificationDTO;
import com.example.voiceapp.exceptions.NotPermittedException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
public class NotificationController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/notify/{recipient}")
    public void sendNotification(@DestinationVariable String recipient,
                                 @Payload NotificationDTO notification,
                                 Principal principal) {
        if (principal == null) {
            throw new NotPermittedException("Unauthorized");
        }
        messagingTemplate.convertAndSendToUser(recipient, "/queue/notifications", notification);
    }
}