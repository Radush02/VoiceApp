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

    /**
     * Atomically attempts to join a call and returns whether this user should be the initiator.
     * Returns true if this user becomes the initiator (first to join), false if joining existing call.
     */
    public boolean attemptJoinCall(String channel, String username) {
        final boolean[] isInitiator = {false};
        
        activeCallers.compute(channel, (chan, existingSet) -> {
            if (existingSet == null) {
                // No call exists, this user becomes initiator
                existingSet = Collections.synchronizedSet(new HashSet<>());
                existingSet.add(username);
                isInitiator[0] = true;
            } else {
                // Call exists, this user joins as participant
                existingSet.add(username);
                isInitiator[0] = false;
            }
            return existingSet;
        });
        
        return isInitiator[0];
    }

    public Set<String> getCurrentCallers(String channel) {
        Set<String> set = activeCallers.get(channel);
        return set == null ? Collections.emptySet() : Collections.unmodifiableSet(set);
    }
}
