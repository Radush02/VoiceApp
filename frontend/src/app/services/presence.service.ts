import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WebsocketService } from './websocket.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class PresenceService  {
  private presenceSubject = new BehaviorSubject<{ [username: string]: boolean }>({});
  presence$ = this.presenceSubject.asObservable();

    constructor(private websocketService: WebsocketService, private http: HttpClient) {
    this.websocketService.onConnect(() => {
      this.websocketService.subscribe('/topic/presence', (data) => {
        this.presenceSubject.next(data);
      });
    });
    this.http.get<{ [username: string]: boolean }>(`${environment.apiUrl}/user/presence`,{withCredentials: true})
        .subscribe(data => this.presenceSubject.next(data));
    }
    

  isUserOnline(username: string): boolean {
    return !!this.presenceSubject.value[username];
  }
}
