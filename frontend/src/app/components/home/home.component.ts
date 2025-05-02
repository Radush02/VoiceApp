import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from '../../services/authentication.service';
@Component({
  selector: 'app-home',
  imports: [CommonModule,RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  constructor(private router: Router, private userService: UserService,private authService:AuthenticationService) {

    this.getFriends();
  }
  friends: any[] = [];
  getFriends() {
    this.userService.getFriends().subscribe((response: any) => {
      this.friends = response.Friends;
      console.log('Friends:', this.friends);
    }, (error: any) => {
      console.error('Error fetching friends:', error);
    });
  }
}
