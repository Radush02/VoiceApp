import { Component,Input } from '@angular/core';
import { ChannelService } from '../../services/channel.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-create-invite',
  imports: [
    CommonModule,    
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    FormsModule
  ],
  templateUrl: './create-invite.component.html',
  styleUrl: './create-invite.component.css'
})
export class CreateInviteComponent {
  
  maxUses: number = 1;
  expiresInMinutes: number = 1;
  @Input() vanityId: string = '';
  errorMessage: string = '';
isLoading: boolean = false;
generatedLink: string = '';
copied: boolean = false;
servers: any[] = [];

  constructor(private channelService: ChannelService, private router: Router) {}
  close(){
    this.router.navigate(['/']);
  }
  createInviteLink() {
  if (!this.vanityId) {
    this.errorMessage = 'Please select a server';
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';

  this.channelService.createInviteLink(this.vanityId, this.maxUses, this.expiresInMinutes).subscribe(
    (response) => {
      this.isLoading = false;
      console.log('Invite link created:', response);
      if (response && response.Server) {
        const inviteId = response.Server;
        const baseUrl = window.location.origin;
        this.generatedLink = `${baseUrl}/invite/${inviteId}`;
      } else {
        this.errorMessage = 'Invalid response from server';
      }
    },
    (error) => {
      this.isLoading = false;
      console.error('Error creating invite link:', error);
      if (error.status === 403 || error.error?.Error?.includes('Only admins')) {
        this.errorMessage = 'You need admin permissions to create invite links for this server.';
      } else if (error.status === 404) {
        this.errorMessage = 'Server not found. Please check the server selection.';
      } else if (error.error?.Error) {
        this.errorMessage = error.error.Error;
      } else {
        this.errorMessage = 'Failed to create invite link. Please try again.';
      }
    }
  );
}
formatExpiration(): string {
  const hours = Math.floor(this.expiresInMinutes / 60);
  const minutes = this.expiresInMinutes % 60;
  return hours > 0 ? `${hours} hour(s) ${minutes} minute(s)` : `${minutes} minute(s)`;
}
copyLink() {
  if (this.generatedLink) {
    navigator.clipboard.writeText(this.generatedLink).then(() => {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = this.generatedLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    });
  }
}

setExpiration(minutes: number) {
  this.expiresInMinutes = minutes;
}

isFormValid(): boolean {
  return !!(this.vanityId && this.maxUses >= 0 && this.expiresInMinutes >= 0);
}
}
