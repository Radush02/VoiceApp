import { Component, Inject } from "@angular/core"
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { MatInputModule } from "@angular/material/input"
import { MatButtonModule } from "@angular/material/button"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { UserService } from "../../services/user.service"
import type { PublicUserDTO } from "../../models/user.model"

@Component({
  selector: "app-friend-request-popup",
  templateUrl: "./friend-request-popup.component.html",
  styleUrls: ["./friend-request-popup.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
})
export class FriendRequestPopupComponent {
  searchQuery = ""
  searchedUser: PublicUserDTO | null = null
  isSearching = false
  searchError = ""
  isSendingRequest = false
  requestSent = false
  requestError = ""

  constructor(
    private dialogRef: MatDialogRef<FriendRequestPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService,
  ) {}

  close() {
    this.dialogRef.close()
  }

  searchUser() {
    if (!this.searchQuery.trim()) {
      this.searchError = "Please enter a username to search"
      return
    }

    this.isSearching = true
    this.searchError = ""
    this.searchedUser = null
    this.requestSent = false
    this.requestError = ""

    this.userService.getUserInfo(this.searchQuery.trim()).subscribe({
      next: (user) => {
        this.searchedUser = user
        this.isSearching = false
      },
      error: (error) => {
        this.isSearching = false
        if (error.status === 404) {
          this.searchError = "User not found"
        } else {
          this.searchError = "Error searching for user. Please try again."
        }
        console.error("Error searching for user:", error)
      },
    })
  }

  sendFriendRequest() {
    if (!this.searchedUser) return

    this.isSendingRequest = true
    this.requestError = ""

    this.userService.sendFriendRequest(this.searchedUser.username).subscribe({
      next: () => {
        this.isSendingRequest = false
        this.requestSent = true
        setTimeout(() => {
          this.dialogRef.close('friend-request-sent');
        }, 1500);
      },
      error: (error) => {
        this.isSendingRequest = false
        if (error.status === 409) {
          this.requestError = "Friend request already sent or you are already friends"
        } else if (error.status === 400) {
          this.requestError = "Cannot send friend request to yourself"
        } else {
          this.requestError = "Error sending friend request. Please try again."
        }
        console.error("Error sending friend request:", error)
      },
    })
  }

  onEnterPressed() {
    if (!this.isSearching && this.searchQuery.trim()) {
      this.searchUser()
    }
  }

  clearSearch() {
    this.searchQuery = ""
    this.searchedUser = null
    this.searchError = ""
    this.requestSent = false
    this.requestError = ""
  }
}
