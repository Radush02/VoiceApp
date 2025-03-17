//package com.example.voiceapp.util;
//
//import io.jsonwebtoken.Jwts;
//import io.jsonwebtoken.SignatureAlgorithm;
//import io.jsonwebtoken.security.Keys;
//import java.security.Key;
//import java.util.Date;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Service;
//
//@Service
//public class JwtUtil {
//  @Value("${jwt.secret.key}")
//  private String SECRET_KEY;
//
//  public String generateToken(String username) {
//    return Jwts.builder()
//        .setSubject(username)
//        .setIssuedAt(new Date())
//        .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
//        .signWith(Keys.hmacShaKeyFor(SECRET_KEY.getBytes()), SignatureAlgorithm.HS256)
//        .compact();
//  }
//
//  private Key getSigningKey() {
//    return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
//  }
//}
