package com.example.voiceapp.controllers;

import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.repository.UserRepository;
import com.example.voiceapp.service.UserService.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired private UserService userService;

    @GetMapping("/getChannels")
    public ResponseEntity<Map<String, Set<Channel>>> getChannels() throws ExecutionException, InterruptedException {
        System.out.println("getChannels");
        return new ResponseEntity<>(Map.of("channels",userService.getChannels().get()), HttpStatus.OK);
    }

}
