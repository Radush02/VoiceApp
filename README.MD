# Real-Time Communication Web Application

This project is a modern, full-stack web application for real-time audio, video, and text communication. It was developed as a Bachelor's Thesis at the Faculty of Mathematics and Computer Science, University of Bucharest. The application provides a feature-rich, scalable, and intuitive platform for users to connect and collaborate.

## Features

* **Real-Time Messaging:** Instant text messaging in public or private channels using WebSockets.
* **Typing Indicators & Presence:** See when users are typing and their online/offline status.
* **Real-Time Notifications:** Mention users and they will receive a notification if they are online.
* **Peer-to-Peer Audio/Video Calls:** High-quality, low-latency audio and video calls powered by WebRTC.
* **Screen Sharing:** Share your screen with others during a video call.
* **Voice Messages:** Record and send voice messages directly in the chat.
* **File Sharing:** Upload and share images within conversations.
* **Communication Servers:** Create and manage themed communication channels.
* **Invite System:** Generate unique invitation links with configurable expiration times and usage limits.
* **User Profiles:** Customizable user profiles with avatars and status messages.
* **Secure Authentication:** Stateless authentication and authorization using JSON Web Tokens (JWT) with HttpOnly cookies.
* **Robust NAT Traversal:** Ensures reliable WebRTC connections using a self-hosted TURN server for restrictive networks.
   * The self-hosted TURN server was enabled only while the thesis was written. For the full-experience, I recommend configuring your own using [**coturn**](https://github.com/coturn/coturn)
   * The STUN server I used was the public one offered by Google.

## Tech Stack

The application is built with a modern, modular architecture to ensure scalability and maintainability.

| **Category** | **Technology** |
| :--- | :--- |
| **Frontend** | [**Angular 19**](https://angular.io/), [**RxJS**](https://rxjs.dev/), [**TypeScript**](https://www.typescriptlang.org/), [**Tailwind CSS**](https://tailwindcss.com/) |
| **Backend** | [**Spring Boot 3**](https://spring.io/projects/spring-boot), [**Java 17**](https://www.oracle.com/java/) |
| **Database** | [**MongoDB**](https://www.mongodb.com/) (NoSQL Document Store) |
| **Real-Time** | [**WebRTC**](https://webrtc.org/) (Audio/Video), [**WebSocket**](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) + [**STOMP**](https://stomp.github.io/) (Messaging) |
| **Services** | [**Amazon S3**](https://aws.amazon.com/s3/) (Media Storage), [**coturn**](https://github.com/coturn/coturn) (Self-hosted TURN Server) |
| **Security** | [**JWT**](https://jwt.io/) (Authentication), [**Spring Security**](https://spring.io/projects/spring-security) |

##  Architecture Overview

The application follows a client-server model with additional peer-to-peer capabilities for media streaming.

1. **Client (Angular):** The single-page application that users interact with. It handles the UI, state management, and all real-time communication logic.
2. **Backend (Spring Boot):** A RESTful API server that manages user data, authentication, channel logic, and signaling for WebRTC.
3. **WebSocket/STOMP:** The backend hosts a WebSocket server with a STOMP message broker. This is used for all real-time text-based communication, including chat messages, typing indicators, and presence updates. It also serves as the **signaling channel** for WebRTC to negotiate peer connections.
4. **WebRTC:** Once signaling is complete, clients establish a direct peer-to-peer connection to stream audio and video. For users behind restrictive firewalls, a **TURN server** is used to relay the media, ensuring a connection can always be established.
5. **Amazon S3:** All user-uploaded media (images, voice recordings) are stored in an S3 bucket. The backend uploads the file and the message sent via WebSocket contains the S3 URL.

## 🚀 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

* Java JDK 17+
* Node.js and npm
* MongoDB instance
* AWS Account with an S3 bucket and credentials
* A configured TURN server (optional, but required for robust P2P connections)

### Backend Setup (Spring Boot)

1. Clone the repository:
   ```sh
   git clone [https://github.com/Radush02/VoiceApp.git](https://github.com/Radush02/VoiceApp.git)
   cd VoiceApp/backend
   ```
2. Configure the application in `src/main/resources/application.properties`:
   
   1. If you want to run the app locally. Don't foget to configure your own certificate and key, otherwise modern browsers (i.e. Chromium, Firefox, etc.) won't allow usage of microphone and camera.
   ```properties
   spring.application.name=VoiceApp
   spring.data.mongodb.port=27017
   spring.data.mongodb.host=localhost
   jwt.secret.key=KEY
   aws.access.key=${AWS_ACCESS_KEY:KEY}
   aws.secret.key=${AWS_SECRET_KEY:KEY}
   aws.s3.bucket=${AWS_S3_BUCKET:NAME}
   server.address=0.0.0.0
   server.port=8080
   server.ssl.enabled=true
   server.ssl.certificate=classpath:ssl/cert.pem
   server.ssl.certificate-private-key=classpath:ssl/key.pem
   logging.level.org.springframework.web.cors=DEBUG
   server.forward-headers-strategy=framework
   static.auth.secret=KEY
   ```

   2. If you want to deploy the app:
   ```properties
   spring.application.name=VoiceApp
   spring.data.mongodb.uri=URL
   jwt.secret.key=KEY
   aws.access.key=${AWS_ACCESS_KEY:KEY}
   aws.secret.key=${AWS_SECRET_KEY:KEY}
   aws.s3.bucket=${AWS_S3_BUCKET:NAME}
   server.address=0.0.0.0
   server.port=8080
   server.ssl.enabled=false
   logging.level.org.springframework.web.cors=DEBUG
   server.forward-headers-strategy=framework
   static.auth.secret=f26e51731b8b5d7a11e76b414e1dcd304f637319a43ba7d026fd102f5e91ad05
   spring.servlet.multipart.max-file-size=20MB
   spring.servlet.multipart.max-request-size=20MB
   ```
3. Run the server:
   ```sh
   ./mvnw spring-boot:run
   ```



### Frontend Setup (Angular, local)

1. Navigate to the frontend directory:
   ```sh
   cd ../frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure the environment in `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'https://localhost:8080/api', // Your backend API URL
     wsUrl: 'wss://localhost:8080/ws',     // Your backend WebSocket URL
   };
   ```
4. Run the development server:
   ```sh
   ng serve
   ```
   Navigate to `http://localhost:4200/`.

### Frontend Setup (Angular, deploy)
1. Navigate to the frontend directory:
   ```sh
   cd ../frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure the environment in `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://website.com/api', // Your backend API URL
     wsUrl: 'wss://localhost:8080/ws',     // Your backend WebSocket URL
   };
   ```

4. Build the app
   ```sh
   ng build --configuration production
   ```

Don't forget to configure the reverse proxy. This is the nginx config file I used during the presentation.
```
server {
    listen 80;
    server_name radush.ro;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name radush.ro;

    ssl_certificate /etc/letsencrypt/live/radush.ro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/radush.ro/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

location /api/ {
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' "$http_origin" always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Content-Length' 0 always;
        add_header 'Content-Type' 'text/plain charset=UTF-8' always;
        return 204;
    }
    add_header 'Access-Control-Allow-Origin' "$http_origin" always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    proxy_pass http://localhost:8080/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}


    location / {
        root /var/www/voiceapp/browser;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

location /ws {
    proxy_pass http://localhost:8080/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Cookie $http_cookie;
    proxy_set_header Origin $http_origin;
}
}
```
## Future Directions

* **Push Notifications:** Implement web push notifications for new messages and calls.
* **Mobile-First Interface:** Develop a dedicated mobile interface or a native mobile application.
* **End-to-End Encryption (E2EE):** Add an extra layer of security by encrypting messages on the client-side.
* **Content Moderation:** Integrate automatic filtering for inappropriate content.
* **Third-Party Integrations:** Allow login via OAuth (Google, GitHub) and other service integrations.

## License

This software is licensed under the terms of the [GNU General Public License v3.0](LICENSE) with the additional restriction that it may not be used for commercial purposes.

