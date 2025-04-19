import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable,map } from 'rxjs';


export interface Channel {
  id: string;
  name: string;
  vanityId: string;
  createdBy: string;
  members: string[];
  imageLink?: string;
}
export interface ChannelMembership{
  vanityId: string;
  role: string;
  joinDate: string;
}
export interface UserDTO {
  imageLink?: string;
  username: string;
  status?: string;
  aboutMe?: string;
  channels: ChannelMembership[];
  friends: string[];
  requests: string[];
}
@Injectable({
  providedIn: 'root'
})

export class UserService {
  private apiLink = 'http://localhost:8080/api/user';
  constructor(private http: HttpClient) {}
  
  getChannels(): Observable<Channel[]> {
    return this.http.get<{channels:Channel[]}>(`${this.apiLink}/getChannels`,{ withCredentials: true }).pipe(map(response => response.channels));
  }
  getUserInfo(): Observable<any>{
    return this.http.get(`${this.apiLink}/info`,{ withCredentials: true });
  }
}
