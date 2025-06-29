package com.example.voiceapp.dtos;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class GetChannelDTO {
    private String name;
    private String vanityId;
    private String photo;
}
