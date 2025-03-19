import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  imports: [FormsModule,CommonModule]
})
export class ChatComponent implements OnInit {
  messages: any[] = [];
  messageContent = '';
  username = 'User' + Math.floor(Math.random() * 1000);
  channel = 'history';

  constructor(private websocketService: WebsocketService,private chatService:ChatService) {}

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
    });
    this.websocketService.getMessages().subscribe((message) => {
      if (message) {
        this.messages.push(message);
      }
    });
  }

  sendMessage() {
    const message = { sender: this.username, content: this.messageContent, channel: this.channel };
    console.log("Sending message:", message);
    this.websocketService.sendMessage(this.channel, message);
    this.messageContent = '';
  }
  
}
