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

    this.getChannels();
  }
  channels: any[] = [];
  getChannels(){
    this.userService.getChannels().subscribe(
      (response: any) => {
        this.channels = response.channels;
        console.log(response);
      },
      (error) => {
        console.error('Error fetching channels:', error);
      }
    );
  }
}
