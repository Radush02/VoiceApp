import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA,MatDialogModule} from '@angular/material/dialog';
import { UserDTO, PublicUserDTO } from '../../models/user.model';
import { CommonModule, NgIf }   from '@angular/common';
import { MatCardModule }        from '@angular/material/card';
import { MatButtonModule }      from '@angular/material/button';
import { UserService } from '../../services/user.service';
import { MatIcon } from '@angular/material/icon';
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
  constructor(
    private dialogRef: MatDialogRef<UserProfilePopupComponent>,
    @Inject(MAT_DIALOG_DATA) public user: UserDTO | PublicUserDTO,
    private userService: UserService
  ) {
    if (this.isSelf()) {
      this.channelsCount = (this.user as UserDTO).channels.length;
      this.requestsCount = (this.user as UserDTO).requests.length;
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
  
}