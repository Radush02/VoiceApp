package com.example.voiceapp.service.UserService;

import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.dtos.*;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import org.springframework.web.multipart.MultipartFile;

public interface UserServiceImpl {

  CompletableFuture<Set<Channel>> getChannels();

  CompletableFuture<Set<String>> getRequests();

  CompletableFuture<Map<String, String>> sendRequest(SendRequestDTO requestDTO);

    CompletableFuture<Map<String,Boolean>> areFriends(String friend);

    CompletableFuture<Map<String, String>> processRequest(ProcessFriendRequestDTO username);

  CompletableFuture<UserDTO> getUser();

  CompletableFuture<PublicUserDTO> getPublicUser(String username);

  CompletableFuture<Map<String, String>> uploadProfilePicture(MultipartFile file)
      throws IOException;

  CompletableFuture<Map<String,String>> updateAboutMe(SingleInputDTO input);

  CompletableFuture<Map<String,String>> updateStatus(SingleInputDTO input);

    CompletableFuture<Map<String,Set<String>>> getFriends();
}
