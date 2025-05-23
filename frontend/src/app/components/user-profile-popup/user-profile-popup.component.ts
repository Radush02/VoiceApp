import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA,MatDialogModule} from '@angular/material/dialog';
import { UserDTO, PublicUserDTO } from '../../models/user.model';
import { CommonModule, NgIf }   from '@angular/common';
import { MatCardModule }        from '@angular/material/card';
import { MatButtonModule }      from '@angular/material/button';
import { UserService } from '../../services/user.service';
import { MatIcon } from '@angular/material/icon';
import { RequestResponse } from '../../enums/RequestResponse';
@Component({
  selector: 'app-user-profile-popup',
  templateUrl: './user-profile-popup.component.html',
  styleUrls: ['./user-profile-popup.component.scss'],
  standalone: true,
  imports: [
    CommonModule,    
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatIcon
  ],
})
export class UserProfilePopupComponent {
  channelsCount: number | null = null;
  requestsCount: number | null = null;
  selectedImage: File | null = null;
  pendingRequests: string[] = [];
  RequestResponse = RequestResponse;

  constructor(
    private dialogRef: MatDialogRef<UserProfilePopupComponent>,
    @Inject(MAT_DIALOG_DATA) public user: UserDTO | PublicUserDTO,
    private userService: UserService
  ) {
    if (this.isSelf()) {
      this.channelsCount = (this.user as UserDTO).channels.length;
      this.requestsCount = (this.user as UserDTO).requests.length;
      this.fetchPendingRequests();

    }
  }

  isSelf(): this is { user: UserDTO } {
    return 'channels' in this.user;
  }

  close() {
    this.dialogRef.close();
  }
  editAboutMe() {
    this.dialogRef.close({ action: 'editAboutMe' });
  }
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
    }
  }
  changeProfilePicture() {
    if (!this.selectedImage) { return; }
    const formData = new FormData();
    formData.append('file', this.selectedImage, this.selectedImage.name);
  
    this.userService.updateProfilePicture(formData).subscribe(
      response => {
        console.log('Profile picture updated successfully:', response);
        this.dialogRef.close({ action: 'updateProfilePicture' });
      },
      error => {
        console.error('Error updating profile picture:', error);
      }
    );

    
  }
    fetchPendingRequests() {
    this.userService.getPendingRequests().subscribe(
      (requests) => {
        this.pendingRequests = requests;
      },
      (error) => {
        console.error('Error fetching pending requests:', error);
      }
    );
  }

  processRequest(username: string, response: RequestResponse) {
    this.userService.processFriendRequest({ username, response }).subscribe(
      () => {
        console.log(`Request ${response.toLowerCase()} successfully for ${username}`);
        this.pendingRequests = this.pendingRequests.filter((req) => req !== username);
        this.requestsCount = this.pendingRequests.length;
      },
      (error) => {
        console.error('Error processing request:', error);
      }
    );
  }
}