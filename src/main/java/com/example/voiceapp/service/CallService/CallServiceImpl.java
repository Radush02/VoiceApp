package com.example.voiceapp.service.CallService;

import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;


@Service
public class CallServiceImpl implements CallService {

    private final Map<String, Set<String>> activeCallers = new ConcurrentHashMap<>();
    public void userJoined(String channel, String username) {
        activeCallers.compute(channel, (chan, existingSet) -> {
            if (existingSet == null) {
                existingSet = Collections.synchronizedSet(new HashSet<>());
            }
            existingSet.add(username);
            return existingSet;
        });
    }

    public void userLeft(String channel, String username) {
        Set<String> set = activeCallers.get(channel);
        if (set != null) {
            set.remove(username);
            if (set.isEmpty()) {
                activeCallers.remove(channel);
            }
        }
    }


    public boolean isCallActive(String channel) {
        Set<String> set = activeCallers.get(channel);
        boolean active = (set != null && !set.isEmpty());
        return active;
    }


    public Set<String> getCurrentCallers(String channel) {
        Set<String> set = activeCallers.get(channel);
        return set == null ? Collections.emptySet() : Collections.unmodifiableSet(set);
    }
}
