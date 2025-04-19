import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators,FormsModule } from '@angular/forms';
import { ChannelService } from "../../services/channel.service"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"

@Component({
  selector: "app-server-popup",
  templateUrl: "./server-popup.component.html",
  styleUrls: ["./server-popup.component.css"],
  imports: [FormsModule,CommonModule,ReactiveFormsModule]
})
export class ServerPopupComponent {
  @Output() close = new EventEmitter<void>();

  serverForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private channelService: ChannelService
  ) {
    this.serverForm = this.fb.group({
      serverName: ['', Validators.required],
      vanityId: ['', Validators.required],
      photo: [null]
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      this.serverForm.patchValue({ photo: null });
      return;
    }

    const file = input.files[0];
    this.serverForm.patchValue({ photo: file });
  }

  createServer(): void {
    if (this.serverForm.invalid) {
      this.serverForm.markAllAsTouched();
      return;
    }

    const { serverName, vanityId, photo } = this.serverForm.value as {
      serverName: string;
      vanityId: string;
      photo: File | null;
    };

    this.channelService
      .createChannel(serverName, vanityId, photo ?? undefined)
      .subscribe({
        next: () => this.close.emit(),
        error: err => console.error('Create failed', err)
      });
  }

  onClose(): void {
    this.close.emit();
  }

}
