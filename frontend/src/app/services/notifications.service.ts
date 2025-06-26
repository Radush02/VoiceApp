import { Injectable } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
import { WebsocketService } from './websocket.service';

export interface Notifications{
    type: 'FRIEND_REQUEST' | 'MESSAGE' | 'MENTION' | 'REPLY';
    content?: string;
}

@Injectable({
  providedIn: 'root'
})

export class NotificationsService {

  private notificationSubject = new BehaviorSubject<Notifications | null>(null);
  public notifications$ = this.notificationSubject.asObservable();

  constructor(private websocketService: WebsocketService) {
    this.subscribeToNotifications();
  }

private subscribeToNotifications(): void {
  this.websocketService.subscribeToUserQueue('/user/queue/notifications', (notification: any) => {
    console.log('Raw notification received:', notification);
    if (notification) {
      const notificationData: Notifications = {
        type: notification.type,
        content: notification.content
      };
      console.log('Processed notification:', notificationData);
      this.notificationSubject.next(notificationData);
    }
  });
}
}