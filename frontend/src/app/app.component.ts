import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NotificationPopupComponent } from './components/notification-popup/notification-popup.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { MatListModule }   from '@angular/material/list';
import { MatCardModule }   from '@angular/material/card';
import { AuthenticationService } from './services/authentication.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    SidebarComponent,
    NotificationPopupComponent,
    RouterOutlet,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatCardModule
  ],
  template: `
    <div class="flex h-screen overflow-hidden">
      <app-sidebar class="w-20 flex-shrink-0"></app-sidebar>
      <div class="flex-1 flex flex-col">
        <router-outlet></router-outlet>
      </div>
      <app-notification-popup></app-notification-popup>
    </div>
  `
})
export class AppComponent implements OnInit {
  title = 'frontend';

  constructor(private authService: AuthenticationService) {}

  ngOnInit() {
    // Initialize authentication state when app starts
    this.authService.initializeAuth().subscribe({
      next: (isAuthenticated) => {
        console.log('App initialization - authenticated:', isAuthenticated);
      },
      error: (error) => {
        console.error('App initialization error:', error);
      }
    });
  }
}
