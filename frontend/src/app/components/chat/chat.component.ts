import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  imports: [FormsModule]
})
export class ChatComponent implements OnInit {
  messages: any[] = [];
  messageContent = '';
  username = 'User' + Math.floor(Math.random() * 1000);
  channel = 'history'; // Default channel

  constructor(private websocketService: WebsocketService) {}

  ngOnInit() {
    this.websocketService.subscribeToChannel(this.channel);
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
