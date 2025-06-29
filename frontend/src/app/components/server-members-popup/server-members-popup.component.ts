import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ChannelService } from '../../services/channel.service';
import { UserService } from '../../services/user.service';
import { CreateInviteComponent } from '../create-invite/create-invite.component';
import { AdminActionPanelComponent } from '../admin-action-panel/admin-action-panel.component';

@Component({
  selector: 'app-server-members-popup',
  templateUrl: './server-members-popup.component.html',
  imports: [CommonModule, FormsModule, CreateInviteComponent],
  standalone: true
})
export class ServerMembersPopupComponent implements OnInit {
  @Input() vanityId: string = '';
  @Input() serverName: string = '';
  @Output() closeEvent = new EventEmitter<void>();
  members: UserDTO[] = [];
  filteredMembers: UserDTO[] = [];
  onlineMembers: UserDTO[] = [];
  offlineMembers: UserDTO[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  searchTerm: string = '';
  showOfflineMembers: boolean = false;
  showCreateInvite: boolean = false;
  currentUser: any = null;
  currentUsername: string = '';
  isAdmin: boolean = false;

  constructor(
    private channelService: ChannelService,
    private userService: UserService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    this.userService.getUserInfo().subscribe(
      (user) => {
        this.currentUser = user;
        this.currentUsername = user.username;
        this.checkAdminStatus();
        this.loadMembers();
      },
      (error) => {
        console.error('Error loading current user:', error);
        this.errorMessage = 'Failed to load user information.';
        this.isLoading = false;
      }
    );
  }

  checkAdminStatus() {
    if (this.currentUser && this.currentUser.channels) {
      const membership = this.currentUser.channels.find((cm: any) => 
        cm.vanityId === this.vanityId
      );
      this.isAdmin = membership?.role === 'ADMIN';
    }
  }

  loadMembers() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.channelService.getMembers(this.vanityId).subscribe(
      (members: UserDTO[]) => {
        this.isLoading = false;
        this.members = Array.isArray(members) ? members : Array.from(members);
        this.categorizeMembers();
        this.filterMembers();
      },
      (error:any) => {
        this.isLoading = false;
        console.error('Error loading members:', error);
        if (error.status === 404) {
          this.errorMessage = 'Server not found.';
        } else {
          this.errorMessage = 'Failed to load server members. Please try again.';
        }
      }
    );
  }

    getUserRole(member: UserDTO): 'ADMIN' | 'USER' {
      return member.role || 'USER';
    }

  isUserOnline(member: UserDTO): boolean {
    return member.status !== 'offline' && member.status !== 'invisible';
  }

  categorizeMembers() {
    this.onlineMembers = this.members.filter(member => this.isUserOnline(member));
    this.offlineMembers = this.members.filter(member => !this.isUserOnline(member));
    
    this.onlineMembers.sort((a, b) => a.username.localeCompare(b.username));
    this.offlineMembers.sort((a, b) => a.username.localeCompare(b.username));
  }

  filterMembers() {
    if (!this.searchTerm.trim()) {
      this.filteredMembers = this.members;
      this.categorizeMembers();
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredMembers = this.members.filter(member =>
      member.username.toLowerCase().includes(searchLower) ||
      (member.aboutMe && member.aboutMe.toLowerCase().includes(searchLower))
    );

    this.onlineMembers = this.filteredMembers.filter(member => this.isUserOnline(member));
    this.offlineMembers = this.filteredMembers.filter(member => !this.isUserOnline(member));
  }

  toggleOfflineMembers() {
    this.showOfflineMembers = !this.showOfflineMembers;
  }

  openCreateInvite() {
    this.showCreateInvite = true;
  }

  closeCreateInvite() {
    this.showCreateInvite = false;
  }

  openMemberOptions(member: UserDTO) {
    console.log('openMemberOptions called with member:', member);
    console.log('Current admin status:', this.isAdmin);
    
    if (!this.isAdmin) {
      console.log('Only admins can perform moderation actions');
      return;
    }

    if (member.username === this.currentUsername) {
      console.log('Cannot perform admin actions on yourself');
      return;
    }

    console.log('Opening admin action dialog...');
    const dialogRef = this.dialog.open(AdminActionPanelComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        member: member,
        currentUsername: this.currentUsername,
        vanityId: this.vanityId
      },
      panelClass: 'admin-action-dialog',
      hasBackdrop: true,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result:', result);
      if (result && result.success) {
        console.log('Admin action completed:', result);

        this.loadMembers();
      }
    });
  }

  viewMemberProfile(member: UserDTO) {
    console.log('Viewing profile for:', member);
  }

  get totalMembers(): number {
    return this.members.length;
  }

  close() {
    this.closeEvent.emit();
  }
}

interface UserDTO {
  imageLink?: string;
  username: string;
  status: string;
  aboutMe?: string;
  channels?: any[];
  friends?: string[];
  requests?: string[];
  role?: 'ADMIN' | 'USER';
}