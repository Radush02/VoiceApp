import { Component } from "@angular/core"
import { FormBuilder, FormGroup, FormsModule, Validators } from "@angular/forms"
import { ServerPopupService } from "../../services/server-popup.service"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"

@Component({
  selector: "app-server-popup",
  templateUrl: "./server-popup.component.html",
  styleUrls: ["./server-popup.component.css"],
  imports: [FormsModule,CommonModule,ReactiveFormsModule]
})
export class ServerPopupComponent {
  serverForm: FormGroup

  constructor(private fb: FormBuilder, private serverPopupService: ServerPopupService) {
    this.serverForm = this.fb.group({
      serverName: ["", [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      vanityId: [
        "",
        [Validators.required, Validators.pattern("^[a-z0-9-]+$"), Validators.minLength(3), Validators.maxLength(20)],
      ]
    })
  }

  onSubmit(): void {
    if (this.serverForm.valid) {
      this.serverPopupService.createChannel(this.serverForm.value.serverName, this.serverForm.value.vanityId).subscribe(
        (response) => {
          console.log(response)
        }
      )
    } else {
      this.serverForm.markAllAsTouched()
    }
  }


}
