package com.example.voiceapp.collection;

import java.util.Date;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "messages")
@Getter
@Setter
public class Message {
  @Id private String id;
  private String sender;
  private String channel;
  private String content;
  private String attachment;
  private Date date;
}
