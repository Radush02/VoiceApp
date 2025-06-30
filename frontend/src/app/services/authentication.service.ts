import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable,map,catchError,of,tap,timer } from 'rxjs';
import { environment } from '../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  
  private apiLink = environment.apiUrl+'/auth';
  private refreshTimer: any;
  
  constructor(private http:HttpClient) { }

  initializeAuth(): Observable<boolean> {
    console.log('Initializing authentication state...');
    return this.loggedIn();
  }

  login(username: string, password: string) {
    console.log('Login called, starting token refresh timer');
    return this.http.post(`${this.apiLink}/login`, {username:username, password },{ withCredentials: true }).pipe(
      tap(() => this.startTokenRefresh())
    );
  }

  register(username: string, password: string,email: string,imageLink?:string): Observable<any> {
    if( !imageLink ) 
      imageLink = 'https://png.pngtree.com/element_our/20200610/ourmid/pngtree-character-default-avatar-image_2237203.jpg';
    return this.http.post(`${this.apiLink}/register`, { username, password,email,imageLink },{ withCredentials: true });
  }

  logout() {
    console.log('Logout called, stopping token refresh timer');
    this.stopTokenRefresh();
    return this.http.post(`${this.apiLink}/logout`, {}, { withCredentials: true });
  }

  refreshToken(): Observable<any> {
    return this.http.post(`${this.apiLink}/refresh`, {}, { withCredentials: true });
  }

  loggedIn(): Observable<boolean> {
    return this.http.post<{isAuthenticated:boolean}>(`${this.apiLink}/check`, {}, { withCredentials: true }).pipe(
      tap(response => {
        console.log('Auth check result:', response.isAuthenticated);
        if (response.isAuthenticated && !this.refreshTimer) {
          console.log('Starting token refresh timer');
          this.startTokenRefresh();
        }
      }),
      map(response=>response.isAuthenticated), 
      catchError((error) => {
        console.error('Auth check failed:', error);
        return of(false);
      }) 
    );
  }
  getUsername(): Observable<string> {
    return this.http.get<{username:string}>(`${this.apiLink}/user/me`, { withCredentials: true }).pipe(
      tap(response => console.log('Username:', response.username)),
      map(response => response.username),
      catchError(() => of('')) 
    );
  }


  private startTokenRefresh() {
    this.stopTokenRefresh();
    const refreshInterval = this.calculateOptimalRefreshTime();
    console.log(`Starting token refresh every ${refreshInterval / 1000 / 60} minutes`);
    
    this.refreshTimer = timer(refreshInterval, refreshInterval).subscribe(() => {
      this.refreshToken().subscribe({
        next: (response) => {
          console.log('Token refreshed successfully');
        },
        error: (error) => {
          console.error('Token refresh failed:', error);
          if (error.status === 401 || error.status === 403) {
            console.log('Authentication failed, logging out');
            this.logout().subscribe();
          } else {
            console.log('Network or other error, will retry on next interval');
          }
        }
      });
    });
  }

  private stopTokenRefresh() {
    if (this.refreshTimer) {
      this.refreshTimer.unsubscribe();
      this.refreshTimer = null;
    }
  }

  private getTokenExpirationTime(): number {
      return 120 * 60 * 1000;
  }

  private calculateOptimalRefreshTime(): number {
    const tokenLifetime = this.getTokenExpirationTime();
    return Math.floor(tokenLifetime * 0.67);

  }

}
