package com.example.voiceapp.controllers;

import com.example.voiceapp.dtos.TurnDTO;
import com.example.voiceapp.util.TurnCredentialUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/turn")
public class TurnController {

    @Value("${static.auth.secret}")
    private  String SHARED_SECRET;
    private static final long TTL = 3600;

    @GetMapping
    public TurnDTO getTurnCredential(@RequestParam String userId) throws Exception {
        long unixTime = Instant.now().getEpochSecond() + TTL;
        String username = unixTime + ":" + userId;
        String credential = TurnCredentialUtil.generateTurnCredential(username, SHARED_SECRET);

        return new TurnDTO(
                username,
                credential,
                List.of(
                        "turn:turn.radush.ro:3478?transport=udp",
                        "turn:turn.radush.ro:3478?transport=tcp",
                        "turns:turn.radush.ro:5349?transport=tcp"
                )
        );
    }
}
