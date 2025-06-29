package com.example.voiceapp.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SeenReceiptDTO {
    private String channelId;
    private String recipientId;
    private List<String> messageIds;
}
