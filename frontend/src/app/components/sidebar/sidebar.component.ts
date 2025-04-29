import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { UserService} from '../../services/user.service';
import { Channel, ChannelMembership, UserDTO } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import { ServerPopupComponent } from '../server-popup/server-popup.component';
import { RouterModule } from '@angular/router';
import { UserProfilePopupComponent } from '../user-profile-popup/user-profile-popup.component';
import { MatDialog } from '@angular/material/dialog';

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

  constructor(private userService: UserService,    private dialog: MatDialog
  ) {}

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
  openProfilePopup() {
    if (!this.user) { return; }
    this.dialog.open(UserProfilePopupComponent, {
      data: this.user,
      panelClass: 'custom-dialog-container'
    });
  }
  openCreatePopup() {
    this.showCreatePopup = true;
  }

  closeCreatePopup() {
    this.showCreatePopup = false;
  }
  
}

