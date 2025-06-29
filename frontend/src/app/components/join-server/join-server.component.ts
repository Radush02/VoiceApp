import { Component } from "@angular/core"
import { FormBuilder, type FormGroup, Validators, FormsModule } from "@angular/forms"
import  { ChannelService } from "../../services/channel.service"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"
import { Router } from "@angular/router"
import { ActivatedRoute } from '@angular/router';
import { DataRefreshService } from "../../services/datarefresh.service"
@Component({
  selector: "app-join-server",
  templateUrl: "./join-server.component.html",
  styleUrls: ["./join-server.component.css"],
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
})
export class JoinServerComponent {
  isLoading = false
  errorMessage = ""
  successMessage = ""
  serverInfo: any = null
  isLoadingServerInfo = false
  vanityId: string = "";
  inviteCode: string = "";
constructor(
  private fb: FormBuilder,
  private channelService: ChannelService,
  private router: Router,
  private route: ActivatedRoute,
  private dataRefreshService: DataRefreshService
) {
  this.route.params.subscribe(params => {
    this.inviteCode = params['code'];
    if (this.inviteCode) {
       this.channelService.getVanityByInviteCode(this.inviteCode).subscribe({
      next: (response) => {
        console.log("Vanity ID response:", response);
        this.vanityId = response.Server;
              this.loadServerInfo(this.vanityId);

        },
        error: (error) => {
          if (error.status === 404) {
            this.errorMessage = "Invalid invite code. Please check the URL and try again."
            return
            } else {
                
              this.errorMessage = "Failed to retrieve server information. Please try again later."
              }
              }
              }
              )
;
    }
  });
}


  loadServerInfo(vanityId: string): void {
    console.log("Loading server info for vanityId:", vanityId)
    this.isLoadingServerInfo = true
    this.serverInfo = null
    this.channelService.getChannelInfo(vanityId).subscribe({
      next: (response) => {
        this.isLoadingServerInfo = false
        this.serverInfo = response
        this.errorMessage = ""
      },
      error: (error) => {
        this.isLoadingServerInfo = false
        this.serverInfo = null
        if (error.status === 404) {
          this.errorMessage = "Server not found. Please check the URL."
        }
      },
    })
  }



  joinServer(): void {
    this.isLoading = true
    this.errorMessage = ""
    this.successMessage = ""

    this.channelService.joinChannel(this.inviteCode).subscribe({
      next: (response) => {
        this.isLoading = false
        console.log("Joined server successfully:", response)
        this.successMessage = "Successfully joined the server!"
        this.dataRefreshService.triggerRefresh('sidebar');
        setTimeout(() => {
          this.router.navigate(["/chat", this.vanityId])
        }, 1500)
      },
      error: (error) => {
        this.isLoading = false
        console.error("Join failed", error)

        if (error.status === 404) {
          this.errorMessage = "Server not found. Please check the URL and try again."
        } else if (error.status === 409) {
          this.errorMessage = "You are already a member of this server."
        } else if (error.status === 403) {
          this.errorMessage = "You do not have permission to join this server."
        } else if (error.status === 400) {
          this.errorMessage = "Invalid server URL. Please check and try again."
        } else {
          this.errorMessage = "Failed to join server. Please try again later."
        }
      },
    })
  }

  goBack(): void {
    this.router.navigate(["/"])
  }
}
