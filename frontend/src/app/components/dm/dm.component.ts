import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { AuthenticationService } from '../../services/authentication.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-dm',
  templateUrl: './dm.component.html',
  styleUrls: ['./dm.component.css'],
  imports: [FormsModule, CommonModule],
  standalone: true
})
export class DmComponent implements OnInit, AfterViewChecked {
  receivedMessages: any[] = [];
  messageContent = '';
  username: string = '';
  recipient: string = '';
  selectedImage: File | null = null;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  constructor(
    private websocketService: WebsocketService,
    private chatService: ChatService,
    private authService: AuthenticationService,
    private params: ActivatedRoute
  ) {
    this.authService.getUsername().subscribe((username) => {
      this.username = username;
      console.log('Username:', this.username);
    });
    this.params.params.subscribe((params) => {
      this.recipient = params['recipient'];
    });
  }

  ngOnInit() {
    this.websocketService.subscribeToChannel('/user/queue/messages', (message: any) => {
      if (message) {
        this.receivedMessages.push(message);
      }
    });
    this.chatService.fetchPrivateMessages(this.recipient).subscribe((messages:any) => {
      if (messages) {
        this.receivedMessages = messages;
      }
      console.log('Fetched messages:', this.receivedMessages);
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
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
    if (!this.recipient) {
      alert('Please enter a recipient username.');
      return;
    }

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
      recipient: this.recipient,
      attachment: imageUrl
    };

    this.websocketService.sendPrivateMessage(this.recipient, message);

    this.messageContent = '';
    this.removeSelectedImage();
  }

  async uploadImage(file: File): Promise<string> {
    const response = await this.chatService.uploadImage(this.recipient, file).toPromise();
    return response.message;
  }
}
