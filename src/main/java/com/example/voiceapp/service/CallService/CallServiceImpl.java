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
        System.out.println(">>> [CallService] userJoined called for channel=" + channel + ", username=" + username);
        activeCallers.compute(channel, (chan, existingSet) -> {
            if (existingSet == null) {
                existingSet = Collections.synchronizedSet(new HashSet<>());
            }
            existingSet.add(username);
            System.out.println(">>> [CallService] After adding, activeCallers[" + channel + "] = " + existingSet);
            return existingSet;
        });
    }

    public void userLeft(String channel, String username) {
        System.out.println(">>> [CallService] userLeft called for channel=" + channel + ", username=" + username);
        Set<String> set = activeCallers.get(channel);
        if (set != null) {
            set.remove(username);
            System.out.println(">>> [CallService] After removing, activeCallers[" + channel + "] = " + set);
            if (set.isEmpty()) {
                activeCallers.remove(channel);
                System.out.println(">>> [CallService] No more users → removed channel " + channel);
            }
        }
    }


    public boolean isCallActive(String channel) {
        Set<String> set = activeCallers.get(channel);
        boolean active = (set != null && !set.isEmpty());
        System.out.println(">>> [CallService] isCallActive(" + channel + ") → " + active + "; callers=" + set);
        return active;
    }


    public Set<String> getCurrentCallers(String channel) {
        Set<String> set = activeCallers.get(channel);
        return set == null ? Collections.emptySet() : Collections.unmodifiableSet(set);
    }
}
