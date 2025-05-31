package com.example.voiceapp.service.CallService;

import java.util.Set;

public interface CallService {
    void userJoined(String channel, String username);
    void userLeft(String channel, String username);
    boolean isCallActive(String channel);
    Set<String> getCurrentCallers(String channel);

}
