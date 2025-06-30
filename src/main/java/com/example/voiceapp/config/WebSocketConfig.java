package com.example.voiceapp.config;

import com.example.voiceapp.security.JwtHandshakeInterceptor;
import com.example.voiceapp.security.UserHandshakeHandler;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  private final JwtHandshakeInterceptor jwtHandshakeInterceptor;
  public WebSocketConfig(JwtHandshakeInterceptor jwtHandshakeInterceptor) {
    this.jwtHandshakeInterceptor = jwtHandshakeInterceptor;
  }

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws").setAllowedOrigins("https://radush.ro").addInterceptors(jwtHandshakeInterceptor).setHandshakeHandler(new UserHandshakeHandler());

  }

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {
    registry.enableSimpleBroker("/channel", "/queue");
    registry.setUserDestinationPrefix("/user");
    registry.setApplicationDestinationPrefixes("/app");
  }

}
