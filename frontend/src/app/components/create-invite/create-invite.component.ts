import { Component } from '@angular/core';
import { ChannelService } from '../../services/channel.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-create-invite',
  imports: [
    CommonModule,    
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatIcon
  ],
  templateUrl: './create-invite.component.html',
  styleUrl: './create-invite.component.css'
})
export class CreateInviteComponent {
  maxUses: number = 1;
  expiresInMinutes: number = 1;
  vanityId: string = '';
  errorMessage: string = '';

  constructor(private channelService: ChannelService, private router: Router) {}

  createInviteLink() {
    this.channelService.createInviteLink(this.vanityId, this.maxUses, this.expiresInMinutes).subscribe(
      (response) => {
        console.log('Invite link created:', response);
        this.router.navigate(['/channel', this.vanityId]);
      },
      (error) => {
        console.error('Error creating invite link:', error);
        this.errorMessage = 'Failed to create invite link. Please try again.';
      }
    );
  }
}
