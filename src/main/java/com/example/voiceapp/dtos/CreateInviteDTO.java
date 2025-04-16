package com.example.voiceapp.dtos;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
public class CreateInviteDTO {
    private String vanityId;
    private Integer maxUses;
    private Integer expiresInMinutes;
}
