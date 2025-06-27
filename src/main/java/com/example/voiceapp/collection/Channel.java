package com.example.voiceapp.collection;

import java.util.*;

import com.example.voiceapp.Enum.Role;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "channels")
@Getter
@Setter
public class Channel {
  @Id private String id;
  private String name;
  private String vanityId;
  private String createdBy;
  private Map<String, Role> members = new HashMap<>();
  private String imageLink;
  private Map<String, Date> mutedMembers = new HashMap<>();
  private Set<String> bannedMembers = new HashSet<>();
}
