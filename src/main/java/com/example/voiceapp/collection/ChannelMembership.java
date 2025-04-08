package com.example.voiceapp.collection;

import com.example.voiceapp.Enum.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;


@Getter
@AllArgsConstructor
public class ChannelMembership{
    private String vanityId;
    private Role role;
}
