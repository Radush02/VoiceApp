import { Component, OnInit, OnDestroy } from "@angular/core"
import { forkJoin, Subject, takeUntil } from "rxjs"
import { UserService } from "../../services/user.service"
import { DataRefreshService } from "../../services/datarefresh.service"
import { Channel, ChannelMembership, UserDTO } from "../../models/user.model"
import { CommonModule } from "@angular/common"
import { ServerPopupComponent } from "../server-popup/server-popup.component"
import { RouterModule } from "@angular/router"
import { UserProfilePopupComponent } from "../user-profile-popup/user-profile-popup.component"
import { MatDialog } from "@angular/material/dialog"
import { AuthenticationService } from "../../services/authentication.service"

@Component({
  selector: "app-sidebar",
  imports: [CommonModule, ServerPopupComponent, RouterModule],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.css",
})
export class SidebarComponent implements OnInit, OnDestroy {
  channels: Channel[] = []
  user: UserDTO | null = null
  showCreatePopup = false
  isLoggedIn = false

  private destroy$ = new Subject<void>()

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private authenticationService: AuthenticationService,
    private dataRefreshService: DataRefreshService,
  ) {}

  ngOnInit() {
    this.loadData()
    this.setLoggedIn()
    this.dataRefreshService.refresh$.pipe(takeUntil(this.destroy$)).subscribe((component) => {
      if (component === "all" || component === "sidebar") {
        this.refreshData()
      }
    })
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private loadData() {
    forkJoin({
      channels: this.userService.getChannels(),
      user: this.userService.getUserInfo(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ channels, user }) => {
          this.user = user
          this.channels = [...channels].sort((a, b) => {
            const aMembership: ChannelMembership = user.channels?.find(
              (cm: ChannelMembership) => cm.vanityId === a.vanityId,
            )
            const bMembership = user.channels?.find((cm: ChannelMembership) => cm.vanityId === b.vanityId)
            if (!aMembership) return 1
            if (!bMembership) return -1
            const aDate = new Date(aMembership.joinDate).getTime()
            const bDate = new Date(bMembership.joinDate).getTime()
            return aDate - bDate
          })
        },
        error: (error) => {
          console.error("Error loading sidebar data:", error)
        },
      })
  }

  refreshData() {
    this.loadData()
  }

  openProfilePopup() {
    if (!this.user) {
      return
    }
    const dialogRef = this.dialog.open(UserProfilePopupComponent, {
      data: this.user,
      panelClass: "custom-dialog-container",
    })

    dialogRef.afterClosed().subscribe(() => {
      this.refreshData()
    })
  }

  openCreatePopup() {
    this.showCreatePopup = true
  }

  closeCreatePopup() {
    this.showCreatePopup = false
    this.refreshData()
  }

  trackByChannelId(index: number, channel: Channel): string {
    return channel.id
  }

  getServerInitial(serverName: string): string {
    return serverName.charAt(0).toUpperCase()
  }

  getUserInitial(username: string): string {
    return username.charAt(0).toUpperCase()
  }

  onImageError(event: any, channel: Channel): void {
    event.target.style.display = "none"
  }

  onUserImageError(event: any): void {
    event.target.style.display = "none"
  }

  setLoggedIn(): void {
    this.authenticationService
      .loggedIn()
      .pipe(takeUntil(this.destroy$))
      .subscribe((loggedIn: boolean) => {
        this.isLoggedIn = loggedIn
      })
  }
}
