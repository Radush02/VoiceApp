import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable,map,catchError,of,tap } from 'rxjs';
import { environment } from '../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  
  private apiLink = environment.apiUrl+'/auth';
  
  constructor(private http:HttpClient) { }

  login(username: string, password: string) {
    return this.http.post(`${this.apiLink}/login`, {username:username, password },{ withCredentials: true });
  }

  register(username: string, password: string,email: string,imageLink?:string): Observable<any> {
    if( !imageLink ) 
      imageLink = 'https://png.pngtree.com/element_our/20200610/ourmid/pngtree-character-default-avatar-image_2237203.jpg';
    return this.http.post(`${this.apiLink}/register`, { username, password,email,imageLink },{ withCredentials: true });
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
  getUsername(): Observable<string> {
    return this.http.get<{username:string}>(`${this.apiLink}/user/me`, { withCredentials: true }).pipe(
      tap(response => console.log('Username:', response.username)),
      map(response => response.username),
      catchError(() => of('')) 
    );
  }

}
