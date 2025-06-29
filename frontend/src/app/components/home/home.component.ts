import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core"
import { CommonModule } from "@angular/common"
import {  Router, RouterModule } from "@angular/router"
import { FormsModule } from "@angular/forms"
import  { UserService } from "../../services/user.service"
import { AuthenticationService } from "../../services/authentication.service"
import { PresenceService } from "../../services/presence.service"
import { Subscription } from "rxjs"
import { MatDialog } from "@angular/material/dialog"
import { UserProfilePopupComponent } from '../user-profile-popup/user-profile-popup.component';
import { FriendRequestPopupComponent } from '../friend-request-popup/friend-request-popup.component';
import { DataRefreshService } from '../../services/datarefresh.service';

interface Friend {
  imageLink: string | null
  username: string
  status: string
  aboutMe: string | null
}

interface UserInfo {
  imageLink: string | null
  username: string
  status: string
  aboutMe: string | null
  friends: Friend[]
  requests?: string[]
  channels?: any[]
  role?: string
}

interface PublicUserInfo {
  imageLink: string | null
  username: string
  status: string
  aboutMe: string | null
  friends: string[]
}

@Component({
  selector: "app-home",
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.css",
})
export class HomeComponent implements OnInit, OnDestroy {
  onlineUsers: { [username: string]: boolean } = {}
  friends: Friend[] = []
  currentUser: UserInfo | null = null
  sortedFriends: Friend[] = []
  searchQuery = ""
  filteredFriends: Friend[] = []
  isLoading = true

  private presenceSubscription?: Subscription

  constructor(
    private router: Router,
    private userService: UserService,
    private authService: AuthenticationService,
    private presenceService: PresenceService,
    private cd: ChangeDetectorRef,
        private dialog: MatDialog,
        private dataRefreshService: DataRefreshService
  ) {}

  ngOnInit() {
    this.loadUserInfo()
    this.getFriends()
    this.subscribeToPresence()
    this.dataRefreshService.triggerRefresh('sidebar');
  }

  ngOnDestroy() {
    if (this.presenceSubscription) {
      this.presenceSubscription.unsubscribe()
    }
  }

  loadUserInfo() {
    this.userService.getUserInfo().subscribe({
      next: (response: UserInfo) => {
        this.currentUser = response
        
        console.log("Current user:", this.currentUser)
      },
      error: (error: any) => {
        console.error("Error fetching user info:", error)
      },
    })
  }

  getFriends() {
    this.userService.getFriends().subscribe({
      next: (response: any) => {
        const friends = response.Friends || []
        console.log('Raw friends response:', friends);
        let loaded = 0
        if (friends.length === 0) {
          this.isLoading = false
          this.sortAndFilterFriends()
          return
        }
        for (const friendUsername of friends) {
          console.log(`About to fetch info for friend: ${friendUsername}`);
          this.userService.getUserInfo(friendUsername).subscribe({
            next: (userInfo: any) => {
              console.log(`Received response for ${friendUsername}:`, userInfo);
              console.log(`Response type check - has 'role' property: ${userInfo.hasOwnProperty('role')}`);
              console.log(`Response type check - has 'channels' property: ${userInfo.hasOwnProperty('channels')}`);
              console.log(`Response type check - has 'requests' property: ${userInfo.hasOwnProperty('requests')}`);
              
              const friendData: Friend = {
                imageLink: userInfo.imageLink,
                username: userInfo.username,
                status: userInfo.status,
                aboutMe: userInfo.aboutMe,
              }
              this.friends.push(friendData)
              loaded++
              if (loaded === friends.length) {
                console.log("Fetched friends:", this.friends)
                this.sortAndFilterFriends()
                this.isLoading = false
                console.log("Friends:", this.friends)
              }
            },
            error: (error: any) => {
              console.error(`Error fetching friend info for ${friendUsername}:`, error);
              console.error('Error status:', error.status);
              console.error('Error message:', error.message);
              console.error('Error details:', error.error);
              loaded++;
              if (loaded === friends.length) {
                this.sortAndFilterFriends();
                this.isLoading = false;
              }
            },
          })
        }
      },
      error: (error: any) => {
        console.error("Error fetching friends:", error)
        this.isLoading = false
      },
    })
  }

  subscribeToPresence() {
    this.presenceSubscription = this.presenceService.presence$.subscribe((data) => {
      this.onlineUsers = data
      this.sortAndFilterFriends()
      this.cd.detectChanges()
    })
  }

  isOnline(username: string): boolean {
    return this.onlineUsers[username] === true
  }
  // Modify sortAndFilterFriends to ignore case sensitivity in search
  sortAndFilterFriends() {
    console.log(this.friends, this.searchQuery);
    const query = this.searchQuery.toLowerCase();
    const filtered = this.friends.filter((friend) =>
      friend.username.toLowerCase().includes(query),
    );
    this.filteredFriends = filtered.sort((a, b) => {
      const aOnline = this.isOnline(a.username);
      const bOnline = this.isOnline(b.username);
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;
      return a.username.localeCompare(b.username, undefined, { sensitivity: 'base' });
    });
  }


  onSearchChange() {
    this.sortAndFilterFriends()
  }

  getOnlineFriendsCount(): number {
    return this.friends.filter((friend) => this.isOnline(friend.username)).length
  }

  getStatusColor(username: string): string {
    return this.isOnline(username) ? "bg-green-500" : "bg-gray-500"
  }

  getStatusText(username: string): string {
    return this.isOnline(username) ? "Online" : "Offline"
  }



startDirectMessage(username: string) {
  console.log('Navigating to DM with:', username);
  this.router.navigate(['/private', username]).catch(error => {
    console.error('Navigation error:', error);
  });
}
  openProfilePopup(username: string):void{
    console.log(`Opening profile popup for: ${username}`);
    this.userService.getUserInfo(username).subscribe({
      next: (user: PublicUserInfo) => {
        console.log('User data received:', user);
        this.dialog.open(UserProfilePopupComponent, {
          data: user,
          panelClass: 'custom-dialog-container'
        });
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  openFriendRequestPopup(): void {
    const dialogRef = this.dialog.open(FriendRequestPopupComponent, {
      panelClass: 'custom-dialog-container',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'friend-request-sent') {
        console.log('Friend request sent, refreshing friends list...');
        this.getFriends();
      }
    });
  }
}
