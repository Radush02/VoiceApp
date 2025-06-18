import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ChannelService } from "../../services/channel.service";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";

@Component({
  selector: "app-server-popup",
  templateUrl: "./server-popup.component.html",
  styleUrls: ["./server-popup.component.css"],
  imports: [FormsModule, CommonModule, ReactiveFormsModule]
})
export class ServerPopupComponent {
  @Output() close = new EventEmitter<void>();

  serverForm: FormGroup;
  selectedPhotoUrl: string | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private channelService: ChannelService
  ) {
    this.serverForm = this.fb.group({
      serverName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      vanityId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9-_]+$/), Validators.minLength(3), Validators.maxLength(20)]],
      photo: [null]
    });

    this.serverForm.get('serverName')?.valueChanges.subscribe(value => {
      if (value && !this.serverForm.get('vanityId')?.touched) {
        const vanityId = this.generateVanityId(value);
        this.serverForm.patchValue({ vanityId }, { emitEvent: false });
      }
    });
  }

  generateVanityId(serverName: string): string {
    return serverName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-') 
      .replace(/-+/g, '-') 
      .replace(/^-|-$/g, '')
      .substring(0, 20);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      this.serverForm.patchValue({ photo: null });
      this.selectedPhotoUrl = null;
      return;
    }

    const file = input.files[0];
        if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image size must be less than 5MB';
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file';
      return;
    }

    this.serverForm.patchValue({ photo: file });
       const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedPhotoUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
        this.errorMessage = '';
  }

  createServer(): void {
    if (this.serverForm.invalid) {
      this.serverForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { serverName, vanityId, photo } = this.serverForm.value as {
      serverName: string;
      vanityId: string;
      photo: File | null;
    };

    this.channelService
      .createChannel(serverName, vanityId, photo ?? undefined)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Server created successfully:', response);
          this.close.emit();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Create failed', error);
          if (error.status === 409) {
            this.errorMessage = 'A server with this URL already exists. Please choose a different one.';
          } else if (error.status === 400) {
            this.errorMessage = 'Invalid server information. Please check your inputs.';
          } else {
            this.errorMessage = 'Failed to create server. Please try again.';
          }
        }
      });
  }

  onClose(): void {
    this.close.emit();
  }
}