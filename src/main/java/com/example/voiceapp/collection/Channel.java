package com.example.voiceapp.collection;

import java.util.HashSet;
import java.util.Set;
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
  private Set<String> members = new HashSet<>();
  private String imageLink;
}
