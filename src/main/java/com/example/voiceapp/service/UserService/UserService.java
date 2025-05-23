package com.example.voiceapp.service.UserService;
import java.util.stream.Collectors;

import com.example.voiceapp.Enum.NotificationType;
import com.example.voiceapp.Enum.RequestResponse;
import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.collection.ChannelMembership;
import com.example.voiceapp.collection.User;
import com.example.voiceapp.dtos.*;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.repository.ChannelRepository;
import com.example.voiceapp.repository.UserRepository;
import com.example.voiceapp.service.S3Service.S3Service;
import java.io.IOException;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UserService implements UserServiceImpl {

  @Autowired private UserRepository userRepository;
  @Autowired private ChannelRepository channelRepository;
  @Autowired private S3Service s3Service;
  @Autowired private SimpMessagingTemplate messagingTemplate;

    @Qualifier("taskExecutor")
    @Autowired private Executor taskExecutor;

  
  @Override
  public CompletableFuture<Set<Channel>> getChannels() {

    User currentUser =
        userRepository
            .findByUsernameIgnoreCase(SecurityContextHolder.getContext().getAuthentication().getName())
            .orElseThrow();
    Set<ChannelMembership> channels = currentUser.getChannels();
    Set<Channel> channelSet = new HashSet<>();
    for (ChannelMembership channel : channels) {
      channelSet.add(
          channelRepository
              .findByVanityId(channel.getVanityId())
              .orElseThrow(() -> new NonExistentException("Channel not found")));
    }
    return CompletableFuture.completedFuture(channelSet);
  }
  
  @Override
  public CompletableFuture<Set<String>> getRequests() {
    User currentUser =
        userRepository
            .findByUsernameIgnoreCase(SecurityContextHolder.getContext().getAuthentication().getName())
            .orElseThrow(() -> new NonExistentException("User not found"));
    Set<String> requests = currentUser.getRequests();
    return CompletableFuture.completedFuture(requests);
  }
  
  @Override
  public CompletableFuture<Map<String, String>> sendRequest(SendRequestDTO requestDTO) {
    System.out.println(requestDTO.getUsername());
    User invitedUser =
        userRepository
            .findByUsernameIgnoreCase(requestDTO.getUsername())
            .orElseThrow(() -> new NonExistentException("User not found"));
    User user =
        userRepository
            .findByUsernameIgnoreCase(SecurityContextHolder.getContext().getAuthentication().getName())
            .orElseThrow(() -> new NonExistentException("Self not found"));

    if (invitedUser.getUsername().equals(user.getUsername())) {
      throw new AlreadyExistsException("You can't send a friend request to yourself.");
    }

    if(user.getFriends().contains(invitedUser.getUsername())) {
      throw new AlreadyExistsException("You are already friends with this user.");
    }

    if (invitedUser.getRequests().contains(user.getUsername())) {
      throw new AlreadyExistsException("You've already sent a friend request");
    }

    invitedUser.getRequests().add(user.getUsername());
    userRepository.save(invitedUser);

    messagingTemplate.convertAndSendToUser(
            invitedUser.getUsername(), "/queue/friend-requests",
            Map.of("from", user.getUsername())
    );
    NotificationDTO notif=new NotificationDTO(NotificationType.FRIEND_REQUEST,"Friend request from "+user.getUsername());
    messagingTemplate.convertAndSendToUser(invitedUser.getUsername(), "/queue/friend-requests", notif);
    return CompletableFuture.completedFuture(Map.of("Response", "Friend request sent!"));
  }
  @Override
  public CompletableFuture<Map<String,Boolean>> areFriends(String friend){
    User user =
            userRepository
                    .findByUsernameIgnoreCase(friend)
                    .orElseThrow(() -> new NonExistentException("Invited user not found"));

    return CompletableFuture.completedFuture(Map.of("Response", user.getFriends().stream().map(String::toUpperCase).toList().contains(SecurityContextHolder.getContext().getAuthentication().getName().toUpperCase())));
  }
  @Override
  public CompletableFuture<Map<String, String>> processRequest(ProcessFriendRequestDTO requestDTO) {
    User user =
        userRepository
            .findByUsernameIgnoreCase(SecurityContextHolder.getContext().getAuthentication().getName())
            .orElseThrow(() -> new NonExistentException("User not found"));
    User invitedUser =
        userRepository
            .findByUsernameIgnoreCase(requestDTO.getUsername())
            .orElseThrow(() -> new NonExistentException("Invited user not found"));

    if (!user.getRequests().contains(requestDTO.getUsername())) {
      throw new NonExistentException("User not found or it didn't send you a request");
    }

    user.getRequests().remove(requestDTO.getUsername());

    if (requestDTO.getResponse().equals(RequestResponse.REJECTED)) {
      userRepository.save(user);
      return CompletableFuture.completedFuture(Map.of("Response", "Rejected"));
    }

    user.getFriends().add(requestDTO.getUsername());
    invitedUser.getFriends().add(user.getUsername());

    userRepository.save(user);
    userRepository.save(invitedUser);
    NotificationDTO notif=new NotificationDTO(NotificationType.FRIEND_REQUEST,"Friend request from "+invitedUser.getUsername()+" accepted");
    messagingTemplate.convertAndSendToUser(user.getUsername(), "/queue/friend-requests", notif);
    return CompletableFuture.completedFuture(Map.of("Response", "Accepted"));
  }

  @Override
  public CompletableFuture<UserDTO> getUser() {

    String username = SecurityContextHolder.getContext().getAuthentication().getName();
    System.out.println("Starting UserRepository lookup for " + username);

    return CompletableFuture.supplyAsync(() -> {
      User user = userRepository
              .findByUsernameIgnoreCase(username)
              .orElseThrow(() -> new NonExistentException("User not found"));
      UserDTO userDTO = new UserDTO();
      userDTO.setImageLink(user.getImageLink());
      userDTO.setStatus(user.getStatus());
      userDTO.setUsername(user.getUsername());
      userDTO.setAboutMe(user.getAboutMe());
      userDTO.setChannels(user.getChannels());
      userDTO.setRequests(user.getRequests());
      userDTO.setFriends(user.getFriends());
      return userDTO;
    },taskExecutor);
  }

  
  @Override
  public CompletableFuture<PublicUserDTO> getPublicUser(String username) {
    User user =
        userRepository
            .findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new NonExistentException("User not found"));
    User self =
        userRepository
            .findByUsernameIgnoreCase(SecurityContextHolder.getContext().getAuthentication().getName())
            .orElseThrow(() -> new NonExistentException("Self not found"));
    PublicUserDTO publicUserDTO = new PublicUserDTO();
    publicUserDTO.setImageLink(user.getImageLink());
    publicUserDTO.setStatus(user.getStatus());
    publicUserDTO.setUsername(user.getUsername());
    publicUserDTO.setAboutMe(user.getAboutMe());
    Set<String> commonFriends = new HashSet<>(user.getFriends());
    commonFriends.retainAll(self.getFriends());
    publicUserDTO.setFriends(commonFriends);
    return CompletableFuture.completedFuture(publicUserDTO);
  }

  
  @Override
  public CompletableFuture<Map<String, String>> uploadProfilePicture(MultipartFile file) throws IOException {
    User u = userRepository
            .findByUsernameIgnoreCase(SecurityContextHolder.getContext().getAuthentication().getName())
            .orElseThrow(() -> new NonExistentException("User not found"));

    String fileName = "pfp/" + u.getUsername() + "." +
            StringUtils.getFilenameExtension(file.getOriginalFilename());

    return s3Service.uploadFile(fileName, file)
            .thenApply(imageUrl -> {
              u.setImageLink(imageUrl);
              userRepository.save(u);
              return Map.of("Response", "Profile picture uploaded.");
            });
  }


  
  @Override
  public CompletableFuture<Map<String,String>> updateAboutMe(SingleInputDTO input){
    User u = userRepository.findByUsernameIgnoreCase(SecurityContextHolder.getContext().getAuthentication().getName()).orElseThrow(() -> new NonExistentException("User not found"));
    u.setAboutMe(input.getInput());
    userRepository.save(u);
    return CompletableFuture.completedFuture(Map.of("Response", "Updated about me"));
  }

  
  @Override
  public CompletableFuture<Map<String,String>> updateStatus(SingleInputDTO input){
    User u = userRepository.findByUsernameIgnoreCase(SecurityContextHolder.getContext().getAuthentication().getName()).orElseThrow(() -> new NonExistentException("User not found"));
    u.setStatus(input.getInput());
    userRepository.save(u);
    return CompletableFuture.completedFuture(Map.of("Response", "Updated status"));
  }

  @Override
  public CompletableFuture<Map<String,Set<String>>> getFriends(){
    User u = userRepository.findByUsernameIgnoreCase(SecurityContextHolder.getContext().getAuthentication().getName()).orElseThrow(() -> new NonExistentException("User not found"));
    return CompletableFuture.completedFuture(Map.of("Friends", u.getFriends()));
  }
}
