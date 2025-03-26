import { Component, type OnInit } from "@angular/core"
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms"
import { Router } from "@angular/router"
import { CommonModule } from "@angular/common"
import { AuthenticationService } from "../../services/authentication.service"
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
  imports: [CommonModule, ReactiveFormsModule]
})
export class LoginComponent implements OnInit {
  loginForm !: FormGroup
  isLoading = false
  showError = false
  errorMessage = "Invalid credentials. Please try again."

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ["", [Validators.required]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    })
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return
    }
    this.authenticationService
      .login(this.loginForm.value.username, this.loginForm.value.password)
      .subscribe(
        (response) => {
          if (response) {
            this.router.navigate(["/chat"])
          } else {
            this.showError = true
          }
        },
        (error) => {
          this.showError = true
        }
      )
  }

  forgotPassword(): void {
    this.router.navigate(["/forgot-password"])
  }

  signUp(): void {
    this.router.navigate(["/register"])
  }
}