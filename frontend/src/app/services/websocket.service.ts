import { Injectable } from '@angular/core';
import { Client, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private stompClient!: Client;
  private messageSubject = new BehaviorSubject<any>(null);

  constructor() {
    this.connect();
  }

  private connect() {
    const socket = new SockJS('http://localhost:8080/ws');
    this.stompClient = Stomp.over(socket);

    this.stompClient.activate();
    this.stompClient.onConnect = () => {
      console.log("Connected to WebSocket");
    };
  }

  subscribeToChannel(channel: string) {
    this.stompClient.subscribe(`/channel/${channel}`, (message: { body: string; }) => {
      this.messageSubject.next(JSON.parse(message.body));
    });
  }

  sendMessage(channel: string, message: any) {
    this.stompClient.publish({ destination: `/app/sendMessage/${channel}`, body: JSON.stringify(message) });
  }

  getMessages() {
    return this.messageSubject.asObservable();
  }
}
