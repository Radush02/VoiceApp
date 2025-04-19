import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { UserService,Channel,UserDTO,ChannelMembership } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { ServerPopupComponent } from '../server-popup/server-popup.component';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-sidebar',
  imports: [CommonModule,ServerPopupComponent,RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  channels: Channel[] = [];
  user: UserDTO | null = null;
  showCreatePopup = false;

  constructor(private userService: UserService) {}

  ngOnInit() {
    forkJoin({
      channels: this.userService.getChannels(),
      user: this.userService.getUserInfo()
    }).subscribe(({ channels, user }) => {
      this.user = user;
      this.channels = [...channels].sort((a, b) => {
        const aMembership: ChannelMembership = user.channels
          .find((cm: ChannelMembership) => cm.vanityId === a.vanityId);
        const bMembership = user.channels
          .find((cm:ChannelMembership) => cm.vanityId === b.vanityId);
        if (!aMembership) return 1;
        if (!bMembership) return -1;
        const aDate = new Date(aMembership.joinDate).getTime();
        const bDate = new Date(bMembership.joinDate).getTime();
        return aDate - bDate;
      });
    });
  }

  openCreatePopup() {
    this.showCreatePopup = true;
  }

  closeCreatePopup() {
    this.showCreatePopup = false;
  }
}

