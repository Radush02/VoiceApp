import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-edit-about-me-popup',
  templateUrl: './edit-about-me-popup.component.html',
  styleUrls: ['./edit-about-me-popup.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
})
export class EditAboutMePopupComponent {
  aboutMeText: string = '';
  originalText: string = '';
  isLoading: boolean = false;
  maxLength: number = 500;

  constructor(
    private dialogRef: MatDialogRef<EditAboutMePopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentAboutMe: string },
    private userService: UserService
  ) {
    this.aboutMeText = data.currentAboutMe || '';
    this.originalText = this.aboutMeText;
  }

  close() {
    this.dialogRef.close();
  }

  save() {
    if (this.aboutMeText.trim() === this.originalText.trim()) {
      this.close();
      return;
    }

    this.isLoading = true;
    
    this.userService.updateAboutMe(this.aboutMeText.trim()).subscribe({
      next: (response) => {
        console.log('About me updated successfully:', response);
        this.dialogRef.close({ 
          action: 'updated', 
          newAboutMe: this.aboutMeText.trim() 
        });
      },
      error: (error) => {
        console.error('Error updating about me:', error);
        this.isLoading = false;
      }
    });
  }

  cancel() {
    this.aboutMeText = this.originalText;
    this.close();
  }

  get hasChanges(): boolean {
    return this.aboutMeText.trim() !== this.originalText.trim();
  }

  get remainingCharacters(): number {
    return this.maxLength - this.aboutMeText.length;
  }

  get isOverLimit(): boolean {
    return this.aboutMeText.length > this.maxLength;
  }
}