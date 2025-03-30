import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable,map,catchError,of,tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  
  private apiLink = 'http://localhost:8080/api/auth';
  
  constructor(private http:HttpClient) { }

  login(username: string, password: string) {
    return this.http.post(`${this.apiLink}/login`, {username:username, password },{ withCredentials: true });
  }

  register(username: string, password: string,email: string): Observable<any> {
    return this.http.post(`${this.apiLink}/register`, { username, password,email },{ withCredentials: true });
  }

  logout() {
    return this.http.post(`${this.apiLink}/logout`, {}, { withCredentials: true })
      .subscribe(() => console.log('Logged out'));
  }
  loggedIn(): Observable<boolean> {
    return this.http.post<{isAuthenticated:boolean}>(`${this.apiLink}/check`, {}, { withCredentials: true }).pipe(
      tap(response => console.log('Logged in:', response.isAuthenticated)),
      map(response=>response.isAuthenticated), 
      catchError(() => of(false)) 
    );
  }
}
