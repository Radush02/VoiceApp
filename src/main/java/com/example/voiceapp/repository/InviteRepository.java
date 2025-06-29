package com.example.voiceapp.repository;

import com.example.voiceapp.collection.Invite;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface InviteRepository extends MongoRepository<Invite, String> {

    Optional<Invite> findById(String inviteCode);
}
