package com.example.voiceapp.repository;

import com.example.voiceapp.collection.Message;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

  List<Message> findAllByChannel(String channel, Pageable pageable);
  List<Message> findAllBySenderAndRecipient(String sender, String recipient, Pageable pageable);
  
  @Query("{ $or: [ { sender: ?0, recipient: ?1 }, { sender: ?1, recipient: ?0 } ] }")
  List<Message> findAllByConversation(String user1, String user2, Pageable pageable);
}
