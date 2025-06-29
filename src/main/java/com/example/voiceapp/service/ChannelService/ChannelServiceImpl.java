package com.example.voiceapp.service.ChannelService;

import com.example.voiceapp.Enum.Action;
import com.example.voiceapp.Enum.Role;
import com.example.voiceapp.collection.Channel;
import com.example.voiceapp.collection.ChannelMembership;
import com.example.voiceapp.collection.Invite;
import com.example.voiceapp.collection.User;
import com.example.voiceapp.dtos.*;
import com.example.voiceapp.exceptions.AlreadyExistsException;
import com.example.voiceapp.exceptions.NonExistentException;
import com.example.voiceapp.exceptions.NotPermittedException;
import com.example.voiceapp.repository.ChannelRepository;
import com.example.voiceapp.repository.InviteRepository;
import com.example.voiceapp.repository.UserRepository;
import com.example.voiceapp.service.AuthService.AuthServiceImpl;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.CompletableFuture;

import com.example.voiceapp.service.S3Service.S3ServiceImpl;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ChannelServiceImpl implements ChannelService {

  @Autowired private ChannelRepository channelRepository;
  @Autowired private UserRepository userRepository;
  @Autowired private AuthServiceImpl authService;
  @Autowired private InviteRepository inviteRepository;
  @Autowired private S3ServiceImpl s3Service;


  @Override
  public CompletableFuture<Map<String, String>> createChannel(ChannelDTO channel) throws IOException {
    User u = userRepository
            .findByUsernameIgnoreCase(authService.extractUsername())
            .orElseThrow(() -> new NonExistentException("User not found"));

    if (channelRepository.existsByName(channel.getName())) {
      throw new AlreadyExistsException("Channel with name " + channel.getName() + " already exists");
    }

    Channel newChannel = new Channel();
    newChannel.setName(channel.getName());
    newChannel.setVanityId(channel.getVanityId());
    newChannel.setCreatedBy(authService.extractUsername());
    newChannel.getMembers().put(authService.extractUsername(), Role.ADMIN);
    u.getChannels().add(new ChannelMembership(newChannel.getVanityId(), Role.ADMIN, new Date()));

    MultipartFile file = channel.getFile();
    if (file != null && !file.isEmpty()) {
      String fileName = channel.getVanityId() + "." +
              StringUtils.getFilenameExtension(file.getOriginalFilename());

      return s3Service.uploadFile(fileName, file)
              .thenApply(imageUrl -> {
                newChannel.setImageLink(imageUrl);
                return saveChannelAndReturn(newChannel, u);
              });
    } else {
      return CompletableFuture.completedFuture(saveChannelAndReturn(newChannel, u));
    }
  }


  private Map<String, String> saveChannelAndReturn(Channel newChannel, User u) {
    channelRepository.save(newChannel);
    userRepository.save(u);
    return Map.of("Created", newChannel.getVanityId());
  }

  
  @Override
  public CompletableFuture<Map<String, String>> joinChannel(String inviteCode) {
    String currentUser = authService.extractUsername();

    Invite invite =
        inviteRepository
            .findById(inviteCode)
            .orElseThrow(() -> new NonExistentException("Invite not found"));

    if (invite.getExpiresAt() != null && invite.getExpiresAt().before(new Date())) {
      throw new NotPermittedException("This invite has expired.");
    }

    if (invite.getMaxUses() != null
        && invite.getUses() != null
        && invite.getUses() >= invite.getMaxUses()) {
      throw new NotPermittedException(
          "This invite has already been used the maximum number of times.");
    }

    User user =
        userRepository
            .findByUsernameIgnoreCase(currentUser)
            .orElseThrow(() -> new NonExistentException("User not found"));
    Channel channel =
        channelRepository
            .findByVanityId(invite.getVanityId())
            .orElseThrow(() -> new NonExistentException("Channel not found"));

    boolean alreadyInChannel =
        user.getChannels().stream().anyMatch(cm -> cm.getVanityId().equals(channel.getVanityId()));
    if (alreadyInChannel) {
      throw new AlreadyExistsException("You have already joined the channel.");
    }

    user.getChannels().add(new ChannelMembership(channel.getVanityId(), Role.USER,new Date()));
    userRepository.save(user);

    if (channel.getMembers() == null) {
      channel.setMembers(new HashMap<>());
    }
    channel.getMembers().put(user.getUsername(),Role.USER);
    channelRepository.save(channel);

    if (invite.getUses() == null) {
      invite.setUses(1);
    } else {
      invite.setUses(invite.getUses() + 1);
    }
    inviteRepository.save(invite);

    return CompletableFuture.completedFuture(Map.of("Server", channel.getVanityId()));
  }

  @Override
  public CompletableFuture<Set<UserDTO>> getUsers(String channel) {
    Channel ch = channelRepository.findByVanityId(channel).orElseThrow(() -> new NonExistentException("Channel not found"));
    Map<String,Role> members = ch.getMembers();
    if(!members.containsKey(authService.extractUsername())){
      throw new NonExistentException("You're not a member.");
    }
    Set<UserDTO> users = new HashSet<>();
    for (Map.Entry<String, Role> entry : members.entrySet()) {
      String member = entry.getKey();
      Role role = entry.getValue();

      User u = userRepository.findByUsernameIgnoreCase(member)
              .orElseThrow(() -> new NonExistentException("User not found"));

      UserDTO dto = new UserDTO();
      dto.setUsername(u.getUsername());
      dto.setStatus(u.getStatus());
      dto.setAboutMe(u.getAboutMe());
      dto.setImageLink(u.getImageLink());
      dto.setChannels(u.getChannels());
      dto.setFriends(u.getFriends());
      dto.setRequests(u.getRequests());
      dto.setRole(role);
      users.add(dto);
    }
    return CompletableFuture.completedFuture(users);
  }

  @Override
  public CompletableFuture<Map<String, String>> createInvite(CreateInviteDTO createInviteDTO) {
    User u =
        userRepository
            .findByUsernameIgnoreCase(authService.extractUsername())
            .orElseThrow(() -> new NonExistentException("User not found"));
    boolean isAdmin =
        u.getChannels().stream()
            .anyMatch(
                cm ->
                    cm.getVanityId().equals(createInviteDTO.getVanityId())
                        && cm.getRole() == Role.ADMIN);
    if (!isAdmin) {
      throw new NotPermittedException("Only admins can create invite links.");
    }
    String inviteId = RandomStringUtils.randomAlphanumeric(10);
    while (inviteRepository.existsById(inviteId)) {
      inviteId = RandomStringUtils.randomAlphanumeric(10);
    }
    Invite invite = new Invite();
    invite.setId(inviteId);
    invite.setVanityId(createInviteDTO.getVanityId());
    invite.setCreatedBy(authService.extractUsername());
    invite.setCreatedAt(new Date());
    if (createInviteDTO.getExpiresInMinutes() != null) {
      long expiresInMS = createInviteDTO.getExpiresInMinutes() * 60L * 1000L;
      invite.setExpiresAt(new Date(new Date().getTime() + expiresInMS));
    }
    if (createInviteDTO.getMaxUses() != null && createInviteDTO.getMaxUses()>0) {
      invite.setMaxUses(createInviteDTO.getMaxUses());
    }
    inviteRepository.save(invite);
    return CompletableFuture.completedFuture(Map.of("Server", inviteId));
  }

  @Override
  public CompletableFuture<Map<String, String>> handleAdminAction(AdminActionDTO action) {
    User admin = getUserByUsername(action.getAdmin());
    Channel channel = getChannelIfAdmin(action.getVanityId(), admin.getUsername());
    if(Objects.equals(admin.getUsername(), channel.getVanityId())) {
      throw new NotPermittedException("Can't do any action on the owner.");
    }
    User target = getUserByUsername(action.getUser());

    switch (action.getAction()) {
      case KICK -> kickUserFromChannel(target, channel);
      case BAN -> {
        channel.getBannedMembers().add(target.getUsername());
        kickUserFromChannel(target, channel);
      }
      case UNBAN -> channel.getBannedMembers().remove(target.getUsername());
      case MUTE -> muteUser(channel, target, action.getMutedMinutes());
      case UNMUTE -> channel.getMutedMembers().remove(target.getUsername());
      default -> throw new IllegalArgumentException("Invalid action");
    }

    channelRepository.save(channel);
    if (action.getAction() == Action.KICK || action.getAction() == Action.BAN) {
      userRepository.save(target);
    }

    return CompletableFuture.completedFuture(Map.of(
            "Server", buildActionMessage(admin.getUsername(), action.getAction(), target.getUsername())
    ));
  }

  @Override
  public CompletableFuture<GetChannelDTO> getChannel(String vanityId) {
    Channel c = channelRepository.findByVanityId(vanityId).orElseThrow(() -> new NonExistentException("Channel not found"));
    GetChannelDTO dto = new GetChannelDTO();
    dto.setName(c.getName());
    dto.setVanityId(c.getVanityId());
    dto.setPhoto(c.getImageLink());
    return CompletableFuture.completedFuture(dto);
  }

  @Override
  public CompletableFuture<Map<String, Boolean>> inServer(InServerDTO inServerDTO) {
    User u = userRepository.findByUsernameIgnoreCase(inServerDTO.getUsername()).orElseThrow(() -> new NonExistentException("User not found"));
    Channel c = channelRepository.findByVanityId(inServerDTO.getVanityId()).orElseThrow(() -> new NonExistentException("Channel not found"));
    if(c.getMembers().containsKey(u.getUsername())) {
      return CompletableFuture.completedFuture(Map.of("Server", true));
    }
    return CompletableFuture.completedFuture(Map.of("Server", false));
  }

  @Override
  public CompletableFuture<Map<String, String>> getServerFromInvite(String inviteCode) {
    Invite i = inviteRepository.findById(inviteCode).orElseThrow(() -> new NonExistentException("Invite not found"));
    return CompletableFuture.completedFuture(Map.of("Server", i.getVanityId()));
  }


  private void kickUserFromChannel(User user, Channel channel) {
    boolean removed = user.getChannels().removeIf(
            membership -> membership.getVanityId().equals(channel.getVanityId())
    );
    if (!removed) {
      throw new NonExistentException("User is not a member of the channel");
    }else{
      channel.getMembers().remove(user.getUsername());
    }
  }

  private void muteUser(Channel channel, User user, Integer mutedMinutes) {
    if (mutedMinutes == null || mutedMinutes <= 0) {
      throw new IllegalArgumentException("Muted minutes must be a positive integer");
    }
    long muteMillis = mutedMinutes * 60L * 1000L;
    Date expiry = new Date(System.currentTimeMillis() + muteMillis);
    channel.getMutedMembers().put(user.getUsername(), expiry);
  }

  private User getUserByUsername(String username) {
    return userRepository.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new NonExistentException("User not found"));
  }

  private Channel getChannelIfAdmin(String vanityId, String adminUsername) {
    Channel channel = channelRepository.findByVanityId(vanityId)
            .orElseThrow(() -> new NonExistentException("Channel not found"));
    Role role = channel.getMembers().get(adminUsername);
    if (role == null || role != Role.ADMIN) {
      throw new NotPermittedException("User is not an admin");
    }
    return channel;
  }

  private String buildActionMessage(String admin, Action action, String target) {
    return switch (action) {
      case KICK -> admin + " kicked " + target;
      case BAN -> admin + " banned " + target;
      case UNBAN -> admin + " unbanned " + target;
      case MUTE -> admin + " muted " + target;
      case UNMUTE -> admin + " unmuted " + target;
    };
  }
}
