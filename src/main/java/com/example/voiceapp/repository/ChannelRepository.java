package com.example.voiceapp.repository;

import com.example.voiceapp.collection.Channel;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChannelRepository extends MongoRepository<Channel, String> {
  boolean existsByName(String name);

  boolean existsByVanityId(String vanityId);

  Channel findByName(String name);

  Optional<Channel> findByVanityId(String vanityId);
}
