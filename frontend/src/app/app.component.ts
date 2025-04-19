import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SidebarComponent, RouterOutlet],
  template: `
    <app-sidebar></app-sidebar>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
title='frontend';
}
