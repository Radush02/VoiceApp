import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef, ChangeDetectorRef, NgZone } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WebrtcService } from '../../services/webrtc.service';
import { ChatService } from '../../services/chat.service';
import { SignalMessage } from '../../models/signal-message.model';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  imports: [FormsModule, CommonModule],
  standalone: true
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private destroy$ = new Subject<void>();

  messages: any[] = [];
  messageContent = '';
  username = '';
  channel = '';
  selectedImage: File | null = null;
  typingUsers = new Set<string>();
  typingTimeouts = new Map<string, any>();
  lastTypingTime = 0;
  typingCooldown = 2000;
  private isCallActive = false;

  remoteStreams: { peerId: string; stream: MediaStream }[] = [];

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('local') private localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('imageUpload') private imageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('remote') private remoteVideo!: ElementRef<HTMLVideoElement>;


  constructor(
    private websocketService: WebsocketService,
    private chatService: ChatService,
    private params: ActivatedRoute,
    private authService: AuthenticationService,
    private webrtc: WebrtcService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
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


    this.websocketService.subscribeToChannel(`/channel/${this.channel}`, msg => {
      this.ngZone.run(() => {
        this.messages = [...this.messages, msg];
        this.cdr.markForCheck();
      });
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

    this.websocketService.subscribeToTyping(this.channel, user => {
      if (user !== this.username) {
        this.typingUsers.add(user);
        if (this.typingTimeouts.has(user)) {
          clearTimeout(this.typingTimeouts.get(user));
        }
        const timeout = setTimeout(() => {
          this.typingUsers.delete(user);
          this.typingTimeouts.delete(user);
          this.cdr.markForCheck();
        }, 3000);
        this.typingTimeouts.set(user, timeout);
        this.cdr.markForCheck();
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
    
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch {}
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedImage = input.files[0];
    }
  }

  getImageName(): string {
    if (this.selectedImage) {
      const name = this.selectedImage.name;
      return name.length > 20 ? name.slice(0, 20) + '...' : name;
    }
    return '';
  }

  removeSelectedImage(): void {
    this.selectedImage = null;
    this.imageInput.nativeElement.value = '';
  }

  async sendMessage() {
    if (!this.messageContent && !this.selectedImage) return;

    let imageUrl = '';
    if (this.selectedImage) {
      try {
        const resp = await firstValueFrom(this.chatService.uploadImage(this.channel, this.selectedImage));
        imageUrl = resp.message;
      } catch (err) {
        console.error('Image upload failed', err);
        alert('Failed to upload image.');
        return;
      }
    }

    const message = { sender: this.username, content: this.messageContent, channel: this.channel, attachment: imageUrl };
    this.websocketService.sendMessage(this.channel, message);
    this.messageContent = '';
    this.removeSelectedImage();
  }

  onTyping(): void {
    const now = Date.now();
    if (now - this.lastTypingTime > this.typingCooldown) {
      this.websocketService.sendTyping(this.channel);
      this.lastTypingTime = now;
    }
  }

 async call() {
    if (!this.channel) return;

    if (this.isCallActive) {
      return;
    }
    console.log('>>> [ChatComponent.call] isCallActive=', this.isCallActive);

    let roomExists: boolean;
    try {
      console.log(`>>> [ChatComponent.call] asking server: is call active on channel="${this.channel}"`);
      const resp = await firstValueFrom(this.chatService.isCallActiveOnServer(this.channel));
      roomExists = resp.active;
      console.log(`>>> [ChatComponent.call] server says active=${roomExists}`);
    } catch (err) {
      console.error('>>> [ChatComponent.call] ERROR while checking call status', err);
      roomExists = false;
    }


    this.isCallActive = true;

    if (!roomExists) {
          console.log('>>> [ChatComponent.call] Not active yet, will initAsInitiator()');

// --- in chat.component.ts, inside the constructor or ngOnInit, you pass a callback to WebrtcService:
await this.webrtc.initAsInitiator(
  this.channel,
  this.localVideo.nativeElement,
  (peerId: string, stream: MediaStream) => {
    // 1) Log that we got a remote stream for peerId
    console.log(`[ChatComponent] onRemoteStream callback invoked for peerId=${peerId}`, stream);

    // 2) Add it to the remoteStreams array so *the template* will render a <video id="remoteVideo_<peerId>">
    this.remoteStreams.push({ peerId, stream });
    this.cdr.markForCheck();

    // 3) After Angular has rendered the <video> tag (with id="remoteVideo_<peerId>"),
    //    grab it from the DOM and set its srcObject. We use a short setTimeout(…, 0)
    //    to ensure that change detection has applied and the DOM node is present.
    setTimeout(() => {
      const vid: HTMLVideoElement | null =
        document.getElementById(`remoteVideo_${peerId}`) as HTMLVideoElement;
      if (vid) {
        console.log(`[ChatComponent] found <video id="remoteVideo_${peerId}"> → attaching stream`);
        vid.srcObject = stream;
      } else {
        console.warn(`[ChatComponent] could NOT find <video id="remoteVideo_${peerId}"> in DOM`);
      }
    }, 0);
  }
);

    } else {
          console.log('>>> [ChatComponent.call] Room already exists on server, will initAsJoiner()');

     await this.webrtc.initAsJoiner(
  this.channel,
  this.localVideo.nativeElement,
  (peerId: string, stream: MediaStream) => {
    console.log(`[ChatComponent] onRemoteStream (joiner) for peerId=${peerId}`, stream);
    this.remoteStreams.push({ peerId, stream });
    this.cdr.markForCheck();
    setTimeout(() => {
      const vid = document.getElementById(`remoteVideo_${peerId}`) as HTMLVideoElement;
      if (vid) {
        console.log(`[ChatComponent] found <video id="remoteVideo_${peerId}"> → attaching stream`);
        vid.srcObject = stream;
      } else {
        console.warn(`[ChatComponent] no <video id="remoteVideo_${peerId}"> found`);
      }
    }, 0);
  }
);

    }
  }

  getTypingUsers(): string {
    return Array.from(this.typingUsers).join(', ');
  }

  endCall() {
    this.webrtc.endCall();
    this.remoteStreams = [];
    this.isCallActive = false;

  }

  toggleCamera() {
    this.webrtc.toggleCamera();
  }

  toggleMic() {
    this.webrtc.toggleMic();
  }

  startScreenShare() {
    this.webrtc.startScreenShare();
  }

  stopScreenShare() {
    this.webrtc.stopScreenShare();
  }
}