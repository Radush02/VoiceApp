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
  private isConnected = false; 
  private pendingSubscriptions: string[] = []; 

  constructor() {
    this.connect();
  }

  private connect() {
    this.stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.stompClient.onConnect = () => {
      console.log('Connected to WebSocket');
      this.isConnected = true;
      this.pendingSubscriptions.forEach(channel => this.subscribeToChannel(channel, () => {}));
      this.pendingSubscriptions = [];
    };

    this.stompClient.onWebSocketError = (error) => {
      console.error('WebSocket Error:', error);
      this.isConnected = false;
    };

    this.stompClient.activate();
  }

  public subscribeToChannel(channel: string, callback: (message: any) => void) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.subscribe(channel, (message) => {
        const parsedMessage = JSON.parse(message.body);
        this.messageSubject.next(parsedMessage);
        callback(parsedMessage);
      });
    } else {
      console.warn('WebSocket not connected yet. Queuing subscription for:', channel);
      this.pendingSubscriptions.push(channel);
    }
  }

  public sendMessage(channel: string, message: any) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: `/app/sendMessage/${channel}`,
        body: JSON.stringify(message)
      });
    } else {
      console.warn('WebSocket not connected. Message not sent:', message);
    }
  }

  public getMessages() {
    return this.messageSubject.asObservable();
  }
}