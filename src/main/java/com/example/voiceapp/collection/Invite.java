package com.example.voiceapp.collection;

import java.util.Date;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "invite")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Invite {
  @Id private String id;
  private String vanityId;
  private String createdBy;
  private Date createdAt;
  private Date expiresAt;
  private Integer maxUses;
  private Integer uses;
}
