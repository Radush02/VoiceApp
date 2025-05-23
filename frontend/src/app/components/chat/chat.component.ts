import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WebrtcService } from '../../services/webrtc.service';
import { ChatService } from '../../services/chat.service';
import { SignalMessage } from '../../models/signal-message.model';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  imports: [FormsModule, CommonModule],
  standalone: true
})
export class ChatComponent implements OnInit, AfterViewChecked {
  messages: any[] = [];
  messageContent = '';
  username: string = '';
  channel: string = '';
  selectedImage: File | null = null;
  typingUsers = new Set<string>();
  typingTimeouts = new Map<string, any>();
  lastTypingTime = 0;
  typingCooldown = 2000; 

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('local')  localVideo!:  ElementRef<HTMLVideoElement>;
  @ViewChild('remote') remoteVideo!: ElementRef<HTMLVideoElement>;
  
  constructor(
    private websocketService: WebsocketService,
    private chatService: ChatService,
    private params: ActivatedRoute,
    private authService: AuthenticationService,
    private webrtc: WebrtcService
  ) {
    this.params.params.subscribe((params) => {
      this.channel = params['channel'];
      console.log('Channel:', this.channel);
    });
    this.authService.getUsername().subscribe((username) => {
      this.username = username;
      console.log('Username:', this.username);
    });
    
  }

  ngOnInit() {
    this.websocketService.subscribeToChannel(`/channel/${this.channel}`, (message: any) => {
      if (message) {
        
        this.messages.push(message);
      }
    });
    
    this.chatService.fetchMessages(this.channel).subscribe((messages) => {
      if (messages) {
        this.messages = messages;
      }
      console.log('Fetched messages:', this.messages);
    });
    
    this.websocketService.getMessages().subscribe((message) => {
      if (message) {
        this.messages.push(message);
      }
    });
  this.websocketService.subscribeToTyping(this.channel, (user) => {
    if (user !== this.username) {
      this.typingUsers.add(user);
      if (this.typingTimeouts.has(user)) {
        clearTimeout(this.typingTimeouts.get(user));
      }

      const timeout = setTimeout(() => {
        this.typingUsers.delete(user);
        this.typingTimeouts.delete(user);
      }, 3000);

      this.typingTimeouts.set(user, timeout);
    }
  });

  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
    }
  }

  getImageName(): string {
    if (this.selectedImage) {
      return this.selectedImage.name.length > 20 ? this.selectedImage.name.substring(0, 20) + '...' : this.selectedImage.name;
    }
    return '';
  }
  removeSelectedImage(): void {
    this.selectedImage = null;
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async sendMessage() {
    if (!this.messageContent && !this.selectedImage) return;

    let imageUrl = '';
    
    if (this.selectedImage) {
      try {
        imageUrl = await this.uploadImage(this.selectedImage);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
        return;
      }
    }

    const message = { 
      sender: this.username, 
      content: this.messageContent, 
      channel: this.channel,
      attachment: imageUrl
    };
    
    console.log("Sending message:", message);
    this.websocketService.sendMessage(this.channel, message);

    this.messageContent = '';
    this.removeSelectedImage();
  }
  sendTyping(channelId: string) {
    this.websocketService.sendTyping(channelId);
  }
onTyping(): void {
  const now = Date.now();
  console.log('Typing event triggered:', now);
  if (now - this.lastTypingTime > this.typingCooldown) {
    this.sendTyping(this.channel);
    this.lastTypingTime = now;
  }
}
  async uploadImage(file: File): Promise<string> {
    const response = await this.chatService.uploadImage(this.channel,file).toPromise();
    return response.message;
  }
  async call() {
    try {
      
      await this.webrtc.init(this.channel, this.localVideo.nativeElement, this.remoteVideo.nativeElement);
    } catch (err:any) {
      console.error('Could not start call:', err);
      alert('Error starting video call: ' + err.message);
    }
  }
  getTypingUsers(): string {
    return Array.from(this.typingUsers).join(', ');
  }
}