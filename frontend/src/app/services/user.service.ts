import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiLink = 'http://localhost:8080/api/user';
  constructor(private http: HttpClient) {}
  
  getChannels(): Observable<any> {
    return this.http.get(`${this.apiLink}/getChannels`,{ withCredentials: true });
  }
}
