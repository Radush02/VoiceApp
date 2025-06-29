import { Injectable } from '@angular/core';
import { Client, Stomp } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { AuthenticationService } from './authentication.service';
import { environment } from '../environments/environment';
import { filter } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private stompClient!: Client;
  protected messageSubject = new BehaviorSubject<any>(null);
  private isConnected = false;
  private pendingSubscriptions: { destination: string; type: 'channel' | 'userQueue'; callback: (data: any) => void }[] = [];
  private onConnectCallbacks: (() => void)[] = [];
  private subscriptions = new Map<string, any>(); // Track subscription objects by destination

  constructor(private router: Router, private authService: AuthenticationService) {
    this.initializeConnection();
  }

  private initializeConnection() {
    const currentUrl = this.router.url;
    const isOnAuthPage = currentUrl === '/login' || currentUrl === '/register' || currentUrl === '/';
    
    if (!isOnAuthPage) {
      this.authService.loggedIn().subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.connect();
        }
      });
    }
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const isOnAuthPageAfterNavigation = event.url === '/login' || event.url === '/register' || event.url === '/';
      if (!isOnAuthPageAfterNavigation && !this.isConnected) {
        this.authService.loggedIn().subscribe(isAuthenticated => {
          if (isAuthenticated) {
            this.connect();
          }
        });
      } else if (isOnAuthPageAfterNavigation && this.isConnected) {
        this.disconnect();
      }
    });
  }

  public connectIfNeeded() {
    if (!this.stompClient || !this.stompClient.connected) {
      this.connect();
    }
  }

  public connect() {
    if (this.stompClient && (this.stompClient.connected || this.stompClient.active)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    this.stompClient = new Client({
      brokerURL: environment.wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.stompClient.onConnect = () => {
      console.log('WebSocket connected successfully');
      this.isConnected = true;
      
      // Process all pending subscriptions
      this.pendingSubscriptions.forEach(sub => {
        if (sub.type === 'channel') {
          this.subscribeToChannel(sub.destination, sub.callback);
        } else if (sub.type === 'userQueue') {
          this.subscribeToUserQueue(sub.destination, sub.callback);
        }
      });
      this.pendingSubscriptions = [];

      this.onConnectCallbacks.forEach(cb => cb());
    };

    this.stompClient.onWebSocketError = (error) => {
      console.error('WebSocket Error:', error);
      this.isConnected = false;
    };

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP Error:', frame);
      this.isConnected = false;
    };

    this.stompClient.onDisconnect = () => {
      console.log('WebSocket disconnected');
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
      if (this.subscriptions.has(topic)) {
        this.subscriptions.get(topic).unsubscribe();
      }
      
      const subscription = this.stompClient.subscribe(topic, message => {
        callback(JSON.parse(message.body));
      });
      
      this.subscriptions.set(topic, subscription);
    });
  }

  public subscribeToChannel(channel: string, callback: (message: any) => void) {
    this.onConnect(() => {
      if (this.subscriptions.has(channel)) {
        this.subscriptions.get(channel).unsubscribe();
      }
      
      const subscription = this.stompClient.subscribe(channel, (message) => {
        const parsedMessage = JSON.parse(message.body);
        this.messageSubject.next(parsedMessage);
        callback(parsedMessage);
      });
      this.subscriptions.set(channel, subscription);
    });

    if (!this.isConnected) {
      this.pendingSubscriptions.push({ destination: channel, type: 'channel', callback });
    }
  }
  public subscribeToUserQueue(destination: string, callback: (data: any) => void): void {
    console.log('Attempting to subscribe to user queue:', destination);
    this.onConnect(() => {
      console.log('Subscribing to user queue (connected):', destination);
      if (this.subscriptions.has(destination)) {
        this.subscriptions.get(destination).unsubscribe();
      }
      
      const subscription = this.stompClient.subscribe(destination, message => {
        callback(JSON.parse(message.body));
      });
      
      this.subscriptions.set(destination, subscription);
      console.log('Successfully subscribed to user queue:', destination);
    });

    if (!this.isConnected) {
      console.log('WebSocket not connected, queuing subscription for:', destination);
      this.pendingSubscriptions.push({ destination, type: 'userQueue', callback });
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
    console.log('To recipient:', recipient);
    console.log('WebSocket connected:', this.stompClient && this.stompClient.connected);
    
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: `/app/sendPrivateMessage/${recipient}`,
        body: JSON.stringify(message)
      });
      console.log('Message sent successfully');
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
  public sendTypingPrivate(recipient: string) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: `/app/typingPrivate/${recipient}`,
        body: '' 
      });
    }
  }
  public unsubscribeFromChannel(destination: string): void {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  public disconnect() {
    if (this.stompClient) {
      console.log('Disconnecting WebSocket...');
      try {
        if (this.stompClient.connected) {
          this.stompClient.deactivate();
        }
      } catch (error) {
        console.error('Error during WebSocket disconnection:', error);
      }
      this.isConnected = false;
      this.subscriptions.clear();
      this.onConnectCallbacks = [];
      this.pendingSubscriptions = [];
    }
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected && this.stompClient && this.stompClient.connected;
  }

  public subscribeToTyping(channel: string, callback: (user: string) => void) {
    this.subscribe(`/channel/${channel}/typing`, (msg) => {
        console.log('Typing received:', msg);

      callback(msg.from);
    });
  }

}