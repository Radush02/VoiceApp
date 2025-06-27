package com.example.voiceapp.dtos;

import com.example.voiceapp.Enum.Action;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminActionDTO {
    private Action action;
    private String vanityId;
    private String admin;
    private String user;
    private Integer mutedMinutes;
}
