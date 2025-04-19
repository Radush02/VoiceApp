package com.example.voiceapp.service.S3Service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.S3Object;
import java.io.IOException;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@Log4j2
public class S3Service implements S3ServiceImpl {

  private final AmazonS3 s3client;

  @Value("${aws.s3.bucket}")
  private String bucketName;

  public S3Service(AmazonS3 s3client) {
    this.s3client = s3client;
  }

  public String uploadFile(String keyName, MultipartFile file) throws IOException {
    ObjectMetadata metadata = new ObjectMetadata();
    metadata.setContentLength(file.getSize());
    metadata.setContentType(file.getContentType());

    PutObjectRequest putRequest =
        new PutObjectRequest(bucketName, keyName, file.getInputStream(), metadata);
    s3client.putObject(putRequest);
    return s3client.getUrl(bucketName, keyName).toString();
  }

  public S3Object getFile(String keyName) {
    return s3client.getObject(bucketName, keyName);
  }
}
