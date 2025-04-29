import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { MatListModule }   from '@angular/material/list';
import { MatCardModule }   from '@angular/material/card';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SidebarComponent, RouterOutlet, MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatCardModule],
  template: `
    <app-sidebar></app-sidebar>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
title='frontend';
}
