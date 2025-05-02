import { Injectable } from '@angular/core';
import { Client, Stomp } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private stompClient!: Client;
  protected messageSubject = new BehaviorSubject<any>(null);
  private isConnected = false; 
  private pendingSubscriptions: string[] = []; 

  constructor() {
    this.connect();
  }

  private connect() {
    this.stompClient = new Client({
      brokerURL: environment.wsUrl,
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

  public sendPrivateMessage(recipient: string, message: any) {
    console.log('Sending private message:', message);
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: `/app/sendPrivateMessage/${recipient}`,
        body: JSON.stringify(message)
      });
    } else {
      console.warn('WebSocket not connected. Private message not sent:', message);
    }
  }
  public getMessages() {
    return this.messageSubject.asObservable();
  }

  public sendSignal(channel: string, message: any) {
    if(this.stompClient.connected) {
      this.stompClient.publish({
        destination:`/app/signal/${channel}`,
        body: JSON.stringify(message)
      });
    }
  }
  public subscribeToSignal(channel: string, callback: (msg:any)=>void) {
    this.subscribeToChannel(`/channel/${channel}/signal`, callback);
  }
}