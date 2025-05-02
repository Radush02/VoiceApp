import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class FriendsGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const recipient = route.paramMap.get('recipient')!;
    return this.userService.areFriends(recipient).pipe(
      map(response => {
        if (response.Response) {
          return true;
        }
        return this.router.createUrlTree(['/home']);
      }),
      catchError(err => {
        console.error('Friends check failed', err);
        return of(this.router.createUrlTree(['/home']));
      })
    );
  }
}