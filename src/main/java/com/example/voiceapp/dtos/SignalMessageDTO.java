package com.example.voiceapp.dtos;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class SignalMessageDTO {
    private String type;
    private String from;
    private Object payload;
}
