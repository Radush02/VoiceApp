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
  private onConnectCallbacks: (() => void)[] = [];

  constructor() {
    this.connect();
  }

  public connect() {
    this.stompClient = new Client({
      brokerURL: environment.wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.stompClient.onConnect = () => {
      this.isConnected = true;
      this.pendingSubscriptions.forEach(channel =>
        this.subscribeToChannel(channel, () => {})
      );
      this.pendingSubscriptions = [];

      this.onConnectCallbacks.forEach(cb => cb());
    };

    this.stompClient.onWebSocketError = (error) => {
      console.error('WebSocket Error:', error);
      this.isConnected = false;
    };

    this.stompClient.activate();
  }

  public onConnect(callback: () => void): void {
    if (this.isConnected) {
      callback();
    } else {
      this.onConnectCallbacks.push(callback);
    }
  }

  public subscribe(topic: string, callback: (data: any) => void): void {
    this.onConnect(() => {
      this.stompClient.subscribe(topic, message => {
        callback(JSON.parse(message.body));
      });
    });
  }

  public subscribeToChannel(channel: string, callback: (message: any) => void) {
    this.onConnect(() => {
      this.stompClient.subscribe(channel, (message) => {
        const parsedMessage = JSON.parse(message.body);
        this.messageSubject.next(parsedMessage);
        callback(parsedMessage);
      });
    });

    if (!this.isConnected) {
      this.pendingSubscriptions.push(channel);
    }
  }
  public subscribeToUserQueue(destination: string, callback: (data: any) => void): void {
    this.onConnect(() => {
      this.stompClient.subscribe(destination, message => {
        callback(JSON.parse(message.body));
      });
    });
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

    public sendTyping(channel: string) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: `/app/typing/${channel}`,
        body: '' 
      });
    }
  }

  public subscribeToTyping(channel: string, callback: (user: string) => void) {
    this.subscribe(`/channel/${channel}/typing`, (msg) => {
        console.log('Typing received:', msg);

      callback(msg.from);
    });
  }

}