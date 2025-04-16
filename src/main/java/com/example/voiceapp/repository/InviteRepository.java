package com.example.voiceapp.repository;

import com.example.voiceapp.collection.Invite;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface InviteRepository extends MongoRepository<Invite, String> {
}
