package com.example.voiceapp.service.UserService;

import com.example.voiceapp.Enum.RequestResponse;
import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.collection.ChannelMembership;
import com.example.voiceapp.collection.User;
import com.example.voiceapp.dtos.ProcessFriendRequestDTO;
import com.example.voiceapp.dtos.PublicUserDTO;
import com.example.voiceapp.dtos.SendRequestDTO;
import com.example.voiceapp.dtos.UserDTO;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UserService implements UserServiceImpl {

  @Autowired private UserRepository userRepository;
  @Autowired private ChannelRepository channelRepository;
  @Autowired private S3Service s3Service;

  @Override
  public CompletableFuture<Set<Channel>> getChannels() {

    User currentUser =
        userRepository
            .findByUsername(SecurityContextHolder.getContext().getAuthentication().getName())
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
            .findByUsername(SecurityContextHolder.getContext().getAuthentication().getName())
            .orElseThrow(() -> new NonExistentException("User not found"));
    Set<String> requests = currentUser.getRequests();
    return CompletableFuture.completedFuture(requests);
  }

  @Override
  public CompletableFuture<Map<String, String>> sendRequest(SendRequestDTO requestDTO) {
    System.out.println(requestDTO.getUsername());
    User invitedUser =
        userRepository
            .findByUsername(requestDTO.getUsername())
            .orElseThrow(() -> new NonExistentException("User not found"));
    User user =
        userRepository
            .findByUsername(SecurityContextHolder.getContext().getAuthentication().getName())
            .orElseThrow(() -> new NonExistentException("Self not found"));

    if (invitedUser.getUsername().equals(user.getUsername())) {
      throw new AlreadyExistsException("You can't send a friend request to yourself.");
    }

    if (invitedUser.getRequests().contains(user.getUsername())) {
      throw new AlreadyExistsException("You've already sent a friend request");
    }

    invitedUser.getRequests().add(user.getUsername());
    userRepository.save(invitedUser);

    return CompletableFuture.completedFuture(Map.of("Response", "Friend request sent!"));
  }

  @Override
  public CompletableFuture<Map<String, String>> processRequest(ProcessFriendRequestDTO requestDTO) {
    User user =
        userRepository
            .findByUsername(SecurityContextHolder.getContext().getAuthentication().getName())
            .orElseThrow(() -> new NonExistentException("User not found"));
    User invitedUser =
        userRepository
            .findByUsername(requestDTO.getUsername())
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

    return CompletableFuture.completedFuture(Map.of("Response", "Accepted"));
  }

  @Override
  public CompletableFuture<UserDTO> getUser() {
    User user =
        userRepository
            .findByUsername(SecurityContextHolder.getContext().getAuthentication().getName())
            .orElseThrow(() -> new NonExistentException("User not found"));
    UserDTO userDTO = new UserDTO();
    userDTO.setImageLink(user.getImageLink());
    userDTO.setStatus(user.getStatus());
    userDTO.setUsername(user.getUsername());
    userDTO.setAboutMe(user.getAboutMe());
    userDTO.setChannels(user.getChannels());
    userDTO.setRequests(user.getRequests());
    userDTO.setFriends(user.getFriends());
    return CompletableFuture.completedFuture(userDTO);
  }

  @Override
  public CompletableFuture<PublicUserDTO> getPublicUser(String username) {
    User user =
        userRepository
            .findByUsername(username)
            .orElseThrow(() -> new NonExistentException("User not found"));
    User self =
        userRepository
            .findByUsername(SecurityContextHolder.getContext().getAuthentication().getName())
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
  public CompletableFuture<Map<String, String>> uploadProfilePicture(MultipartFile file)
      throws IOException {
    User u =
        userRepository
            .findByUsername(SecurityContextHolder.getContext().getAuthentication().getName())
            .orElseThrow(() -> new NonExistentException("User not found"));
    String fileName = "pfp/" + u.getUsername() +"."+ StringUtils.getFilenameExtension(file.getOriginalFilename());
    u.setImageLink(s3Service.uploadFile(fileName, file));
    userRepository.save(u);
    return CompletableFuture.completedFuture(Map.of("Response", "Profile picture uploaded."));
  }
}
