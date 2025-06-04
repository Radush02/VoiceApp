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
import { SignalMessage } from "../../models/signal-message.model";
import { Subject, firstValueFrom, Subscription } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.css"],
  imports: [FormsModule, CommonModule],
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

  private isCallActive = false;
  remoteStreams: { peerId: string; stream: MediaStream }[] = [];

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
    private ngZone: NgZone
  ) {
    this.params.params.subscribe((params) => {
      this.channel = params["channel"];
      console.log("Channel:", this.channel);
    });

    this.authService.getUsername().subscribe((username) => {
      this.username = username;
      console.log("Username:", this.username);
    });
  }

  ngOnInit() {
    this.websocketService.subscribeToChannel(`/channel/${this.channel}`, (msg) => {
      this.ngZone.run(() => {
        this.messages = [...this.messages, msg];
        this.cdr.markForCheck();
      });
    });

    this.chatService.fetchMessages(this.channel).subscribe((messages) => {
      if (messages) {
        this.messages = messages;
      }
      console.log("Fetched messages:", this.messages);
    });

    // this.websocketService.getMessages().subscribe((message) => {
    //   if (message) {
    //     this.messages.push(message);
    //   }
    // });

    this.websocketService.subscribeToTyping(this.channel, (user) => {
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
    if (this.isRecording) {
      this.stopRecording();
    }
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

    let roomExists: boolean;
    try {
      const resp = await firstValueFrom(
        this.chatService.isCallActiveOnServer(this.channel)
      );
      roomExists = resp.active;
    } catch (err) {
      roomExists = false;
    }

    this.isCallActive = true;

    if (!roomExists) {
      await this.webrtc.initAsInitiator(
        this.channel,
        this.localVideo.nativeElement,
        (peerId: string, stream: MediaStream) => {
          this.remoteStreams.push({ peerId, stream });
          this.cdr.markForCheck();
          setTimeout(() => {
            const vid: HTMLVideoElement | null = document.getElementById(
              `remoteVideo_${peerId}`
            ) as HTMLVideoElement;
            if (vid) {
              vid.srcObject = stream;
            }
          }, 0);
        }
      );
    } else {
      await this.webrtc.initAsJoiner(
        this.channel,
        this.localVideo.nativeElement,
        (peerId: string, stream: MediaStream) => {
          this.remoteStreams.push({ peerId, stream });
          this.cdr.markForCheck();
          setTimeout(() => {
            const vid = document.getElementById(
              `remoteVideo_${peerId}`
            ) as HTMLVideoElement;
            if (vid) {
              vid.srcObject = stream;
            }
          }, 0);
        }
      );
    }
  }

  getTypingUsers(): string {
    return Array.from(this.typingUsers).join(", ");
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

  isImage(url: string): boolean {
    return /\.(jpe?g|png|gif|bmp|webp)(\?.*)?$/i.test(url);
  }

  isAudio(url: string): boolean {
    return /\.(mp3|wav|ogg|webm)(\?.*)?$/i.test(url);
  }
}
