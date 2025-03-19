import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private apiLink = 'http://localhost:8080/api/messages';
  constructor(private http:HttpClient) { }

  fetchMessages(channel: string, limit: number=50): Observable<any> {
    return this.http.get(`${this.apiLink}/${channel}`);
  }
}
