import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable,map } from 'rxjs';
import { Channel } from '../models/user.model';
@Injectable({
  providedIn: 'root'
})

export class UserService {
  private apiLink = 'http://localhost:8080/api/user';
  constructor(private http: HttpClient) {}
  
  getChannels(): Observable<Channel[]> {
    return this.http.get<{channels:Channel[]}>(`${this.apiLink}/getChannels`,{ withCredentials: true }).pipe(map(response => response.channels));
  }
  getUserInfo(): Observable<any>;
  getUserInfo(user: string): Observable<any>;
  getUserInfo(user?: string): Observable<any> {
    if (user) {
      return this.http.get(`${this.apiLink}/info/${user}`, { withCredentials: true });
    } else {
      return this.http.get(`${this.apiLink}/info`, { withCredentials: true });
    }
  }
  updateAboutMe(aboutMe: string): Observable<any> {
    return this.http.post(`${this.apiLink}/update/aboutme`, { input:aboutMe }, { withCredentials: true });
  }
  updateStatus(status: string): Observable<any> {
    return this.http.post(`${this.apiLink}/update/status`, { input: status }, { withCredentials: true });
  }
  updateProfilePicture(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiLink}/upload`, formData, { withCredentials: true });
  }
  getFriends(): Observable<any> {
    return this.http.get(`${this.apiLink}/friends`, { withCredentials: true });
  }
}
