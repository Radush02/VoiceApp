package com.example.voiceapp.service.S3Service;

import com.amazonaws.services.s3.model.S3Object;
import java.io.IOException;
import java.util.concurrent.CompletableFuture;

import org.springframework.web.multipart.MultipartFile;

public interface S3Service {

  public CompletableFuture<String> uploadFile(String keyName, MultipartFile file) throws IOException;

  public S3Object getFile(String keyName);
}
