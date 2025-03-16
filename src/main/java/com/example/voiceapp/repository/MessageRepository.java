package com.example.voiceapp.repository;

import com.example.voiceapp.collection.Message;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MessageRepository extends MongoRepository<Message, String> {}
