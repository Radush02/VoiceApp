import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  
  private apiLink = 'http://localhost:8080/api/auth';
  
  constructor(private http:HttpClient) { }

  login(email: string, password: string) {
    return this.http.post(`${this.apiLink}/login`, { email, password }, { withCredentials: true });
  }

  register(username: string, password: string,email: string): Observable<any> {
    return this.http.post(`${this.apiLink}/register`, { username, password,email });
  }

  logout() {
    return this.http.post(`${this.apiLink}/logout`, {}, { withCredentials: true })
      .subscribe(() => console.log('Logged out'));
  }
  
  loggedIn(){
    return this.http.post(`${this.apiLink}/check`, {}, { withCredentials: true });
  }
}
