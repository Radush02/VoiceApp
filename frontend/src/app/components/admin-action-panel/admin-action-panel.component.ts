import { Component, Inject } from "@angular/core"
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { MatInputModule } from "@angular/material/input"
import { MatButtonModule } from "@angular/material/button"
import { MatSelectModule } from "@angular/material/select"
import { MatSliderModule } from "@angular/material/slider"
import type { UserDTO, AdminActionDTO } from "../../models/user.model"

import { ChannelService } from "../../services/channel.service"

interface AdminActionData {
  member: UserDTO
  currentUsername: string
  vanityId: string
}
enum Action{
  KICK = "KICK",
  BAN = "BAN",
  MUTE = "MUTE",
  UNBAN = "UNBAN",
  UNMUTE = "UNMUTE",
}
@Component({
  selector: "app-admin-action-panel",
  templateUrl: "./admin-action-panel.component.html",
  styleUrls: ["./admin-action-panel.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatButtonModule, MatSelectModule, MatSliderModule],
})
export class AdminActionPanelComponent {
  Action = Action
  selectedAction: Action | null = null
  muteMinutes = 60
  reason = ""
  isProcessing = false
  actionError = ""

  muteDurations = [
    { label: "5 minutes", value: 5 },
    { label: "15 minutes", value: 15 },
    { label: "30 minutes", value: 30 },
    { label: "1 hour", value: 60 },
    { label: "2 hours", value: 120 },
    { label: "6 hours", value: 360 },
    { label: "12 hours", value: 720 },
    { label: "24 hours", value: 1440 },
    { label: "7 days", value: 10080 },
    { label: "Custom", value: -1 },
  ]

  customMuteMinutes = 60
  selectedMuteDuration = 60

  constructor(
    private dialogRef: MatDialogRef<AdminActionPanelComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AdminActionData,
    private channelService: ChannelService,
  ) {}

  close() {
    this.dialogRef.close()
  }

  selectAction(action: Action) {
    this.selectedAction = action
    this.actionError = ""
    if (action !== Action.MUTE) {
      this.selectedMuteDuration = 60
      this.customMuteMinutes = 60
    }
  }

  onMuteDurationChange() {
    if (this.selectedMuteDuration === -1) {
      this.muteMinutes = this.customMuteMinutes
    } else {
      this.muteMinutes = this.selectedMuteDuration
    }
  }

  executeAction() {
    if (!this.selectedAction) return
    this.isProcessing = true
    this.actionError = ""
    const adminAction: AdminActionDTO = {
      action: Action[this.selectedAction],
      vanityId: this.data.vanityId,
      admin: this.data.currentUsername,
      user: this.data.member.username,
    }

    if (this.selectedAction === Action.MUTE) {
      adminAction.mutedMinutes = this.muteMinutes
    }

    this.channelService.handleAdminAction(adminAction).subscribe({
      next: (response) => {
        this.isProcessing = false
        this.dialogRef.close({
          success: true,
          action: this.selectedAction,
          member: this.data.member,
          response,
        })
      },
      error: (error) => {
        this.isProcessing = false
        this.actionError = this.getErrorMessage(error)
        console.error("Admin action error:", error)
      },
    })
  }

  private getErrorMessage(error: any): string {
    if (error.status === 403) {
      return "You do not have permission to perform this action."
    } else if (error.status === 404) {
      return "User or server not found."
    } else if (error.status === 409) {
      return "Action cannot be performed (user may already be banned/muted)."
    } else if (error.error?.message) {
      return error.error.message
    } else {
      return "An error occurred while performing the action. Please try again."
    }
  }

  getActionDescription(action: Action): string {
    switch (action) {
      case Action.KICK:
        return "Remove the user from the server. They can rejoin with an invite."
      case Action.BAN:
        return "Permanently ban the user from the server. They cannot rejoin."
      case Action.MUTE:
        return "Temporarily prevent the user from sending messages."
      case Action.UNBAN:
        return "Remove the ban from this user, allowing them to rejoin."
      case Action.UNMUTE:
        return "Remove the mute from this user, allowing them to send messages."
      default:
        return ""
    }
  }

  getActionIcon(action: Action): string {
    switch (action) {
      case Action.KICK:
        return "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      case Action.BAN:
        return "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
      case Action.MUTE:
        return "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
      case Action.UNBAN:
        return "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
      case Action.UNMUTE:
        return "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      default:
        return ""
    }
  }

  getActionColor(action: Action): string {
    switch (action) {
      case Action.KICK:
        return "text-yellow-400 hover:text-yellow-300"
      case Action.BAN:
        return "text-red-400 hover:text-red-300"
      case Action.MUTE:
        return "text-orange-400 hover:text-orange-300"
      case Action.UNBAN:
        return "text-green-400 hover:text-green-300"
      case Action.UNMUTE:
        return "text-blue-400 hover:text-blue-300"
      default:
        return "text-gray-400"
    }
  }
}
