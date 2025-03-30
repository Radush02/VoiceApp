import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { Observable,tap,map } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class LoggedGuard implements CanActivate {
  constructor(private authService: AuthenticationService, private router: Router) { }

  canActivate(): Observable<boolean> {
    return this.authService.loggedIn().pipe(
      tap(loggedIn => {
        if (!loggedIn) {
          console.log('You are not logged in!');
        } else {
          console.log('You are already logged in!');
          this.router.navigate(['/chat']);
        }
      }),
      map(loggedIn => loggedIn)
    );
  }
}