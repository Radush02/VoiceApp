import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable,map } from 'rxjs';
import { Channel } from '../models/user.model';
import { environment } from '../environments/environment';
import { RequestResponse } from '../enums/RequestResponse';
@Injectable({
  providedIn: 'root'
})

export class UserService {
  private apiLink = environment.apiUrl+'/user';
  constructor(private http: HttpClient) {}
  
  getChannels(): Observable<Channel[]> {
    return this.http.get<{channels:Channel[]}>(`${this.apiLink}/getChannels`,{ withCredentials: true }).pipe(map(response => response.channels));
  }
  getUserInfo(): Observable<any>;
  getUserInfo(user: string): Observable<any>;
  getUserInfo(user?: string): Observable<any> {
    if (user) {
      const encodedUser = encodeURIComponent(user);
      const url = `${this.apiLink}/info/${encodedUser}`;
      return this.http.get(url, { withCredentials: true }).pipe(
        map((response: any) => {
          return response;
        })
      );
    } else {
      const url = `${this.apiLink}/info`;
      return this.http.get(url, { withCredentials: true }).pipe(
        map((response: any) => {
          return response;
        })
      );
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
    updateProfilePictureRegister(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiLink}/upload/register`, formData, { withCredentials: true });
  }
  getFriends(): Observable<any> {
    return this.http.get(`${this.apiLink}/friends`, { withCredentials: true });
  }
  areFriends(user: string): Observable<any> {
    return this.http.get(`${this.apiLink}/friends/${user}`, { withCredentials: true });
  }
  getPendingRequests(): Observable<string[]> {
  return this.http.get<string[]>(`${this.apiLink}/getRequests`, { withCredentials: true });
}
  sendFriendRequest(username: string): Observable<any> {
  return this.http.post(`${this.apiLink}/sendRequest/${username}`, {}, { withCredentials: true });
  }
processFriendRequest(data: { username: string; response: RequestResponse }): Observable<void> {
  return this.http.post<void>(`${this.apiLink}/processRequest`, data, { withCredentials: true });
}
}
