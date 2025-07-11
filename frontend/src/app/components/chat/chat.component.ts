import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  NgZone,
} from "@angular/core";
import { WebsocketService } from "../../services/websocket.service";
import { ActivatedRoute } from "@angular/router";
import { AuthenticationService } from "../../services/authentication.service";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { WebrtcService } from "../../services/webrtc.service";
import { ChatService } from "../../services/chat.service";
import {Message} from "../../models/user.model";
import { Subject, firstValueFrom, Subscription } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";
import { ServerMembersPopupComponent } from "../server-members-popup/server-members-popup.component";
import { MatDialog } from "@angular/material/dialog";
import { UserProfilePopupComponent } from '../user-profile-popup/user-profile-popup.component';
import { UserService } from "../../services/user.service";
import { MentionHighlightPipe } from "../../pipes/mention-highlight.pipe";

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.css"],
  imports: [FormsModule, CommonModule,ServerMembersPopupComponent,MentionHighlightPipe],
  standalone: true,
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private destroy$ = new Subject<void>();

  messages: any[] = [];
  messageContent = "";
  username = "";
  channel = "";
  selectedImage: File | null = null;
  typingUsers = new Set<string>();
  typingTimeouts = new Map<string, any>();
  lastTypingTime = 0;
  typingCooldown = 2000;
  isLocalCameraOn = true;

showMembersPopup: boolean = false;
serverName: string = '';
openMembersPopup(): void {
  this.showMembersPopup = true;
  this.serverName = this.channel;
}

closeMembersPopup(): void {
  this.showMembersPopup = false;
}
  private isCallActive = false;
  remoteStreams: { peerId: string; stream: MediaStream;  cameraOn: boolean;}[] = [];

  private mediaRecorder!: MediaRecorder;
  private recordedChunks: Blob[] = [];
  isRecording: boolean = false;
  isUploadingAudio: boolean = false;

  private subs: Subscription[] = [];

  @ViewChild("messagesContainer")
  private messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild("local") private localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild("imageUpload") private imageInput!: ElementRef<HTMLInputElement>;
  @ViewChild("remote") private remoteVideo!: ElementRef<HTMLVideoElement>;

  constructor(
    private websocketService: WebsocketService,
    private chatService: ChatService,
    private params: ActivatedRoute,
    private authService: AuthenticationService,
    private webrtc: WebrtcService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private dialog: MatDialog,
    private userService: UserService
  ) {
    this.params.params.subscribe((params) => {
      const newChannel = params["channel"];
      if (newChannel && newChannel !== this.channel) {
        this.channel = newChannel;
        if (this.username) {
          this.loadChannelData(this.channel);
        }
      }
});

    this.authService.getUsername().subscribe((username) => {
      this.username = username;
      console.log("Username:", this.username);
      if (this.channel && this.username) {
        this.loadChannelData(this.channel);
      }
    });
  }

  ngOnInit() {
    if (this.channel && this.username) {
      this.loadChannelData(this.channel);
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    if (this.isRecording) {
      this.stopRecording();
    }
      if (this.channel) {
      this.websocketService.unsubscribeFromChannel(`/channel/${this.channel}`);
      this.websocketService.unsubscribeFromChannel(`/channel/${this.channel}/typing`);
    }
    
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
    this.destroy$.next();
    this.destroy$.complete();
    this.subs.forEach((s) => s.unsubscribe());
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch {
    }
  }
private loadChannelData(channel: string): void {
  if (this.channel && this.channel !== channel) {
    this.websocketService.unsubscribeFromChannel(`/channel/${this.channel}`);
    this.websocketService.unsubscribeFromChannel(`/channel/${this.channel}/typing`);
  }

  this.messages = [];

  this.websocketService.subscribeToChannel(`/channel/${channel}`, (payload: Message | Message[]) => {
    this.ngZone.run(() => {
      if (Array.isArray(payload)) {
        payload.forEach(updatedMsg => {
          const index = this.messages.findIndex(m => m.id === updatedMsg.id);
          if (index !== -1) {
            this.messages[index].seenBy = updatedMsg.seenBy;
          }
        });
      } else {
        this.messages = [...this.messages, payload];
        this.sendSeenReceipt([payload]);
      }
      this.cdr.markForCheck();
    });
  });

  this.chatService.fetchMessages(channel).subscribe((messages) => {
    if (messages) {
      this.messages = messages;
    }
    console.log("Fetched messages:", this.messages);
  });

  this.websocketService.subscribeToTyping(channel, (user) => {
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

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedImage = input.files[0];
    }
  }

  getImageName(): string {
    if (this.selectedImage) {
      const name = this.selectedImage.name;
      return name.length > 20 ? name.slice(0, 20) + "..." : name;
    }
    return "";
  }

  removeSelectedImage(): void {
    this.selectedImage = null;
    this.imageInput.nativeElement.value = "";
  }

  async sendMessage() {
    if (!this.messageContent && !this.selectedImage) return;
    let attachmentUrl = "";
    if (this.selectedImage) {
      try {
        const resp = await firstValueFrom(
          this.chatService.uploadImage(this.channel, this.selectedImage)
        );
        attachmentUrl = resp.message;
      } catch (err) {
        console.error("Image upload failed", err);
        alert("Failed to upload image.");
        return;
      }
    }
    const message = {
      sender: this.username,
      content: this.messageContent.trim(), 
      channel: this.channel,
      attachment: attachmentUrl,
    };

    this.websocketService.sendMessage(this.channel, message);
    this.messageContent = "";
    this.removeSelectedImage();
  }

  onTyping(): void {
    const now = Date.now();
    if (now - this.lastTypingTime > this.typingCooldown) {
      this.websocketService.sendTyping(this.channel);
      this.lastTypingTime = now;
    }
  }

  async startRecording(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Media Devices API not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      this.mediaRecorder = new MediaRecorder(stream);
      this.recordedChunks = [];
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.onRecordingStop();
        stream.getTracks().forEach((t) => t.stop());
      };
      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Could not access microphone: " + err);
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.isUploadingAudio = true;
    }
  }

  private async onRecordingStop(): Promise<void> {
    const audioBlob = new Blob(this.recordedChunks, {
      type: "audio/webm; codecs=opus",
    });

    const filename = `${this.channel}/${uuidv4()}.webm`;
    const audioFile = new File([audioBlob], filename, {
      type: "audio/webm",
      lastModified: Date.now(),
    });

    let attachmentUrl = "";
    try {
      const resp = await firstValueFrom(
        this.chatService.uploadImage(this.channel, audioFile)
      );
      attachmentUrl = resp.message;
    } catch (uploadErr) {
      console.error("Failed to upload audio:", uploadErr);
      alert("Audio upload failed: " + uploadErr);
      this.isUploadingAudio = false;
      return;
    }
    const message = {
      sender: this.username,
      content: "",
      channel: this.channel,
      attachment: attachmentUrl,
    };
    this.websocketService.sendMessage(this.channel, message);
    this.isUploadingAudio = false;
  }

  async call() {
    if (!this.channel) return;
    if (this.isCallActive) {
      return;
    }

    let isInitiator: boolean;
    try {
      const resp = await firstValueFrom(
        this.chatService.joinCall(this.channel)
      );
      isInitiator = resp.isInitiator;
    } catch (err) {
      console.error("Failed to join call:", err);
      return;
    }

    this.isCallActive = true;

    if (isInitiator) {
      await this.webrtc.initAsInitiator(
        this.channel,
        this.localVideo.nativeElement,
        (peerId: string, stream: MediaStream) => {
          const existingStreamIndex = this.remoteStreams.findIndex(s => s.peerId === peerId);
          if (existingStreamIndex > -1) {
            this.remoteStreams[existingStreamIndex].stream = stream;
            this.remoteStreams[existingStreamIndex].cameraOn = stream.getVideoTracks().some(track => track.enabled);
          } else {
            this.remoteStreams.push({ peerId, stream, cameraOn: stream.getVideoTracks().some(track => track.enabled) });
          }
          this.cdr.markForCheck();
          setTimeout(() => {
            const vid: HTMLVideoElement | null = document.getElementById(
              `remoteVideo_${peerId}`
            ) as HTMLVideoElement;
            if (vid) {
              vid.srcObject = stream;
            }
          }, 0);
        },
        (peerId: string) => {
          this.remoteStreams = this.remoteStreams.filter(s => s.peerId !== peerId);
          this.cdr.markForCheck();
        }
      );
    } else {
      await this.webrtc.initAsJoiner(
        this.channel,
        this.localVideo.nativeElement,
        (peerId: string, stream: MediaStream) => {
        const existingStreamIndex = this.remoteStreams.findIndex(s => s.peerId === peerId);
        if (existingStreamIndex > -1) {
          this.remoteStreams[existingStreamIndex].stream = stream;
          this.remoteStreams[existingStreamIndex].cameraOn = stream.getVideoTracks().some(track => track.enabled);
        } else {
          this.remoteStreams.push({ peerId, stream, cameraOn: stream.getVideoTracks().some(track => track.enabled) });
        }

          this.cdr.markForCheck();
          setTimeout(() => {
            const vid = document.getElementById(
              `remoteVideo_${peerId}`
            ) as HTMLVideoElement;
            if (vid) {
              vid.srcObject = stream;
            }
          }, 0);
        },
        (peerId: string) => {
          this.remoteStreams = this.remoteStreams.filter(s => s.peerId !== peerId);
          this.cdr.markForCheck();
        }
      );
    }
  }
selectedStream: string | null = null;

selectStream(peerId: string) {
  this.selectedStream = this.selectedStream === peerId ? null : peerId;
}

  getTypingUsers(): string {
    return Array.from(this.typingUsers).join(", ");
  }

  endCall() {
    this.webrtc.endCall();
    this.remoteStreams = [];
    this.isCallActive = false;
  }

toggleCamera(): void {
  this.isLocalCameraOn = this.webrtc.toggleCamera();
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

  isImage(url: string): boolean {
    return /\.(jpe?g|png|gif|bmp|webp)(\?.*)?$/i.test(url);
  }

  isAudio(url: string): boolean {
    return /\.(mp3|wav|ogg|webm)(\?.*)?$/i.test(url);
  }

serverId: string = '';
currentChannelId: string = '';
currentVoiceChannelId: string = '';
textChannels: any[] = [];
voiceChannels: any[] = [];
currentUser: any = null;
isMicrophoneMuted: boolean = false;
isDeafened: boolean = false;


trackByChannelId(index: number, channel: any): string {
  return channel.id;
}

joinVoiceChannel(channel: any): void {
  this.currentVoiceChannelId = channel.id;
}

toggleMicrophone(): void {
  this.isMicrophoneMuted = !this.isMicrophoneMuted;
}

toggleHeadphones(): void {
  this.isDeafened = !this.isDeafened;

}

openUserSettings(): void {

}

private sendSeenReceipt(messages: Message[]): void {
  const unseenMessageIds = messages
    .filter(msg => msg.sender !== this.username && !msg.seenBy.includes(this.username))
    .map(msg => msg.id);

  if (unseenMessageIds.length > 0) {
    const receipt = {
      channelId: this.channel,
      recipientId: null,
      messageIds: unseenMessageIds,
    };
    this.websocketService.sendMessage('/app/seen', receipt);
  }
}

  hasBeenSeen(message: Message): boolean {
    return message.seenBy.filter(u => u !== this.username).length > 0;
  }
openProfilePopup(username: string):void{

    this.userService.getUserInfo(username).subscribe(
      (user) => {;
    this.dialog.open(UserProfilePopupComponent, {
        data: user,
        panelClass: 'custom-dialog-container'
      });
      });
}
}