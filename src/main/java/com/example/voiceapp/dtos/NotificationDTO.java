package com.example.voiceapp.dtos;

import com.example.voiceapp.Enum.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class NotificationDTO {
    private NotificationType type;
    private String content;
}
