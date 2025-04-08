package com.example.voiceapp.repository;

import com.example.voiceapp.collection.Message;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

  List<Message> findAllByChannel(String channel, Pageable pageable);
}
