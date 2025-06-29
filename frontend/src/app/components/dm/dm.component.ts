import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  NgZone,
} from "@angular/core"
import { WebsocketService } from "../../services/websocket.service"
import { AuthenticationService } from "../../services/authentication.service"
import { FormsModule } from "@angular/forms"
import { CommonModule } from "@angular/common"
import { ChatService } from "../../services/chat.service"
import { ActivatedRoute } from "@angular/router"
import { WebrtcService } from "../../services/webrtc.service"
import { Subject, firstValueFrom, Subscription } from "rxjs"
import { v4 as uuidv4 } from "uuid"
import { MatDialog } from "@angular/material/dialog"
import { UserService } from "../../services/user.service"
import { MentionHighlightPipe } from "../../pipes/mention-highlight.pipe"
import { UserProfilePopupComponent } from "../user-profile-popup/user-profile-popup.component"

@Component({
  selector: "app-dm",
  templateUrl: "./dm.component.html",
  styleUrls: ["./dm.component.css"],
  imports: [FormsModule, CommonModule, MentionHighlightPipe],
  standalone: true,
})
export class DmComponent implements OnInit, OnDestroy, AfterViewChecked {
  private destroy$ = new Subject<void>()

  receivedMessages: any[] = []
  messageContent = ""
  username = ""
  recipient = ""
  selectedImage: File | null = null
  typingUsers = new Set<string>()
  typingTimeouts = new Map<string, any>()
  lastTypingTime = 0
  typingCooldown = 2000
  isLocalCameraOn = true

  private isCallActive = false
  remoteStreams: { peerId: string; stream: MediaStream; cameraOn: boolean }[] = []

  private mediaRecorder!: MediaRecorder
  private recordedChunks: Blob[] = []
  isRecording = false
  isUploadingAudio = false

  private subs: Subscription[] = []
  selectedStream: string | null = null

  @ViewChild("messagesContainer") private messagesContainer!: ElementRef
  @ViewChild("local") private localVideo!: ElementRef<HTMLVideoElement>
  @ViewChild("imageUpload") private imageInput!: ElementRef<HTMLInputElement>

  constructor(
    private websocketService: WebsocketService,
    private chatService: ChatService,
    private authService: AuthenticationService,
    private params: ActivatedRoute,
    private webrtc: WebrtcService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private dialog: MatDialog,
    private userService: UserService,
  ) {
    this.authService.getUsername().subscribe((username) => {
      this.username = username
      console.log("Username:", this.username)
      // Check if we can load DM data now that we have username
      if (this.recipient && this.username) {
        this.loadDMData()
      }
    })
    this.params.params.subscribe((params) => {
      this.recipient = params["recipient"]
      console.log("Recipient from params:", this.recipient)
      // Check if we can load DM data now that we have recipient
      if (this.recipient && this.username) {
        this.loadDMData()
      }
    })
  }

  ngOnInit() {
    if (this.recipient && this.username) {
      this.loadDMData()
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom()
  }

  ngOnDestroy() {
    if (this.isRecording) {
      this.stopRecording()
    }

    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout))
    this.typingTimeouts.clear()
    this.websocketService.unsubscribeFromChannel("/user/queue/messages");
    this.websocketService.unsubscribeFromChannel("/user/queue/typing");
    
    this.destroy$.next()
    this.destroy$.complete()
    this.subs.forEach((s) => s.unsubscribe())
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight
    } catch {}
  }

  private loadDMData(): void {
    console.log("Loading DM data for recipient:", this.recipient);
    this.receivedMessages = []
    this.websocketService.unsubscribeFromChannel("/user/queue/messages");
    this.websocketService.unsubscribeFromChannel("/user/queue/typing");
    
    // Ensure WebSocket is connected before subscribing
    if (!this.websocketService.isWebSocketConnected()) {
      console.log("WebSocket not connected, attempting to connect...");
      this.websocketService.connectIfNeeded();
    }
    
    console.log("WebSocket connected:", this.websocketService.isWebSocketConnected());
    
    this.websocketService.subscribeToUserQueue("/user/queue/messages", (message: any) => {
      this.ngZone.run(() => {
        console.log("=== WebSocket Message Received ===");
        console.log("Received private message:", message);
        console.log("Message sender:", message.sender);
        console.log("Message recipient:", message.recipient);
        console.log("Current recipient:", this.recipient);
        console.log("Current username:", this.username);
        
        // Check if this message belongs to this conversation
        const isForThisConversation = 
          (message.sender === this.recipient && message.recipient === this.username) ||
          (message.sender === this.username && message.recipient === this.recipient);
        
        console.log("Is for this conversation:", isForThisConversation);
        
        if (message && isForThisConversation) {
          console.log("Message is for this conversation, checking for duplicates...");
          
          // Check for duplicates to avoid adding the same message twice
          const isDuplicate = this.receivedMessages.some(existingMsg => 
            existingMsg.sender === message.sender &&
            existingMsg.content === message.content &&
            existingMsg.attachment === message.attachment &&
            Math.abs(new Date(existingMsg.date).getTime() - new Date(message.date).getTime()) < 1000 // Within 1 second
          );
          
          console.log("Is duplicate:", isDuplicate);
          console.log("Current messages count:", this.receivedMessages.length);
          
          if (!isDuplicate) {
            console.log("Adding message to receivedMessages array");
            this.receivedMessages.push(message)
            console.log("New messages count:", this.receivedMessages.length);
            // Only send seen receipt for messages we receive (not our own)
            if (message.sender === this.recipient) {
              this.sendSeenReceipt([message])
            }
          } else {
            console.log("Skipping duplicate message");
          }
        } else {
          console.log("Message is not for this conversation, ignoring");
        }
        this.cdr.markForCheck()
        console.log("=== End WebSocket Message Processing ===");
      })
    })

    // Subscribe to typing notifications for DMs
    this.websocketService.subscribeToUserQueue("/user/queue/typing", (typingData: any) => {
      this.ngZone.run(() => {
        console.log("Received typing notification:", typingData);
        if (typingData.from === this.recipient) {
          this.typingUsers.add(typingData.from)
          if (this.typingTimeouts.has(typingData.from)) {
            clearTimeout(this.typingTimeouts.get(typingData.from))
          }
          const timeout = setTimeout(() => {
            this.typingUsers.delete(typingData.from)
            this.typingTimeouts.delete(typingData.from)
            this.cdr.markForCheck()
          }, 3000)
          this.typingTimeouts.set(typingData.from, timeout)
          this.cdr.markForCheck()
        }
      })
    })

    this.chatService.fetchPrivateMessages(this.recipient).subscribe((messages: any) => {
      if (messages) {
        console.log("Fetched existing messages:", messages);
        this.receivedMessages = messages
      }
      console.log("Final receivedMessages:", this.receivedMessages)
    })
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0]
    }
  }

  getImageName(): string {
    if (this.selectedImage) {
      const name = this.selectedImage.name
      return name.length > 20 ? name.slice(0, 20) + "..." : name
    }
    return ""
  }

  removeSelectedImage(): void {
    this.selectedImage = null
    this.imageInput.nativeElement.value = ""
  }

  async sendMessage() {
    console.log("Sending message...");
    if (!this.messageContent && !this.selectedImage) return
    if (!this.recipient) {
      alert("Please enter a recipient username.")
      return
    }

    let imageUrl = ""

    if (this.selectedImage) {
      try {
        const response = await firstValueFrom(this.chatService.uploadImage(this.recipient, this.selectedImage))
        imageUrl = response.message
      } catch (error) {
        console.error("Error uploading image:", error)
        alert("Failed to upload image. Please try again.")
        return
      }
    }

    const message = {
      sender: this.username,
      content: this.messageContent.trim(),
      recipient: this.recipient,
      attachment: imageUrl,
      date: new Date().toISOString(), // Add timestamp
    }

    console.log("Sending message via WebSocket:", message);
    console.log("WebSocket connected:", this.websocketService.isWebSocketConnected());

    // Send the message via WebSocket - the server will echo it back to both users
    this.websocketService.sendPrivateMessage(this.recipient, message)

    this.messageContent = ""
    this.removeSelectedImage()
  }

  onTyping(): void {
    const now = Date.now()
    if (now - this.lastTypingTime > this.typingCooldown) {
      // Send typing notification for DM using the correct mapping
      this.websocketService.sendTypingPrivate(this.recipient)
      this.lastTypingTime = now
    }
  }

  async startRecording(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Media Devices API not supported in this browser.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })
      this.mediaRecorder = new MediaRecorder(stream)
      this.recordedChunks = []
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        this.onRecordingStop()
        stream.getTracks().forEach((t) => t.stop())
      }
      this.mediaRecorder.start()
      this.isRecording = true
    } catch (err) {
      console.error("Error accessing microphone", err)
      alert("Could not access microphone: " + err)
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
      this.isRecording = false
      this.isUploadingAudio = true
    }
  }

  private async onRecordingStop(): Promise<void> {
    const audioBlob = new Blob(this.recordedChunks, {
      type: "audio/webm; codecs=opus",
    })

    const filename = `dm-${this.recipient}/${uuidv4()}.webm`
    const audioFile = new File([audioBlob], filename, {
      type: "audio/webm",
      lastModified: Date.now(),
    })

    let attachmentUrl = ""
    try {
      const resp = await firstValueFrom(this.chatService.uploadImage(this.recipient, audioFile))
      attachmentUrl = resp.message
    } catch (uploadErr) {
      console.error("Failed to upload audio:", uploadErr)
      alert("Audio upload failed: " + uploadErr)
      this.isUploadingAudio = false
      return
    }
    const message = {
      sender: this.username,
      content: "",
      recipient: this.recipient,
      attachment: attachmentUrl,
      date: new Date().toISOString(),
    }
    
    // Send the message via WebSocket - the server will echo it back to both users
    this.websocketService.sendPrivateMessage(this.recipient, message)
    this.isUploadingAudio = false
  }

  async call() {
    if (!this.recipient) return
    if (this.isCallActive) {
      return
    }

    let isInitiator: boolean
    try {
      const resp = await firstValueFrom(this.chatService.joinCall(`dm-${this.recipient}`))
      isInitiator = resp.isInitiator
    } catch (err) {
      console.error("Failed to join call:", err)
      return
    }

    this.isCallActive = true

    if (isInitiator) {
      await this.webrtc.initAsInitiator(
        `dm-${this.recipient}`,
        this.localVideo.nativeElement,
        (peerId: string, stream: MediaStream) => {
          this.remoteStreams.push({
            peerId,
            stream,
            cameraOn: stream.getVideoTracks().some((track) => track.enabled),
          })
          this.cdr.markForCheck()
          setTimeout(() => {
            const vid: HTMLVideoElement | null = document.getElementById(`remoteVideo_${peerId}`) as HTMLVideoElement
            if (vid) {
              vid.srcObject = stream
            }
          }, 0)
        },
      )
    } else {
      await this.webrtc.initAsJoiner(
        `dm-${this.recipient}`,
        this.localVideo.nativeElement,
        (peerId: string, stream: MediaStream) => {
          this.remoteStreams.push({
            peerId,
            stream,
            cameraOn: stream.getVideoTracks().some((track) => track.enabled),
          })
          this.cdr.markForCheck()
          setTimeout(() => {
            const vid = document.getElementById(`remoteVideo_${peerId}`) as HTMLVideoElement
            if (vid) {
              vid.srcObject = stream
            }
          }, 0)
        },
      )
    }
  }

  selectStream(peerId: string) {
    this.selectedStream = this.selectedStream === peerId ? null : peerId
  }

  endCall() {
    this.webrtc.endCall()
    this.remoteStreams = []
    this.isCallActive = false
  }

  toggleCamera(): void {
    this.isLocalCameraOn = this.webrtc.toggleCamera()
  }

  toggleMic() {
    this.webrtc.toggleMic()
  }

  startScreenShare() {
    this.webrtc.startScreenShare()
  }

  stopScreenShare() {
    this.webrtc.stopScreenShare()
  }

  isImage(url: string): boolean {
    return /\.(jpe?g|png|gif|bmp|webp)(\?.*)?$/i.test(url)
  }

  isAudio(url: string): boolean {
    return /\.(mp3|wav|ogg|webm)(\?.*)?$/i.test(url)
  }

  private sendSeenReceipt(messages: any[]): void {
    const unseenMessageIds = messages
      .filter((msg) => msg.sender !== this.username && !msg.seenBy?.includes(this.username))
      .map((msg) => msg.id)

    if (unseenMessageIds.length > 0) {
      const receipt = {
        channelId: null,
        recipientId: this.recipient,
        messageIds: unseenMessageIds,
      }
      this.websocketService.sendMessage("/app/seen", receipt)
    }
  }

  hasBeenSeen(message: any): boolean {
    return message.seenBy?.filter((u: string) => u !== this.username).length > 0
  }

  openProfilePopup(username: string): void {
    this.userService.getUserInfo(username).subscribe((user) => {
      this.dialog.open(UserProfilePopupComponent, {
        data: user,
        panelClass: "custom-dialog-container",
      })
    })
  }
}
