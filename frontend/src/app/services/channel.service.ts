import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  private apiLink = 'http://localhost:8080/api/channel'; 
  
  constructor(private http: HttpClient) {}

  createChannel(name: string, vanityId: string, photo?: File): Observable<any> {
    return this.http.post(`${this.apiLink}/create`, { name, vanityId, photo });
  }
}
