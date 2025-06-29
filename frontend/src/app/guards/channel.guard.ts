// import { Injectable } from '@angular/core';
// import {
//   CanActivate,
//   ActivatedRouteSnapshot,
//   RouterStateSnapshot,
//   UrlTree,
//   Router
// } from '@angular/router';
// import { Observable, of } from 'rxjs';
// import { map, catchError } from 'rxjs/operators';
// import { UserService } from '../services/user.service';
// import { ChannelService } from '../services/channel.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class ChannelGuard implements CanActivate {
//   constructor(
//     private channelService: ChannelService,
//     private router: Router
//   ) {}

//   canActivate(
//     route: ActivatedRouteSnapshot,
//   ): Observable<boolean | UrlTree> {
//     const recipient = route.paramMap.get('recipient')!;
//     return this.channelService.inServer(recipient).pipe(
//       map(response => {
//         if (response.Response) {
//           return true;
//         }
//         return this.router.createUrlTree(['/home']);
//       }),
//       catchError(err => {
//         console.error('Friends check failed', err);
//         return of(this.router.createUrlTree(['/home']));
//       })
//     );
//   }
// }