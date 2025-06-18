import { Component, type OnInit } from "@angular/core"
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from "@angular/forms"
import { Router } from "@angular/router"
import { CommonModule } from "@angular/common"
import { AuthenticationService } from "../../services/authentication.service"
import { UserService } from "../../services/user.service"

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm !: FormGroup;
  isLoading = false;
  showError = false;
  errorMessage = "Registration failed. Please try again.";
  selectedFile: File | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authenticationService: AuthenticationService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      username: ["", [Validators.required, this.usernameValidator]],
      password: ["", [Validators.required, Validators.minLength(8), this.passwordValidator]],
      email: ["", [Validators.required, Validators.email, this.emailValidator]],
      confirmPassword: ["", [Validators.required]],
      profilePicture: [null]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null
      : { 'mismatch': true };
  }

  emailValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const email = control.value?.trim().toLowerCase();
    const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/;
    return email && emailRegex.test(email) ? null : { invalidEmail: true };
  }

  usernameValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const username = control.value;
    const usernameRegex = /^[a-zA-Z0-9._-]{3,20}$/;
    return username && usernameRegex.test(username) ? null : { invalidUsername: true };
  }

  passwordValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.value;
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$/;
    return password && passwordRegex.test(password) ? null : { invalidPassword: true };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }
    this.isLoading = true;

    const formData = new FormData();
    formData.append('username', this.registerForm.value.username);
    formData.append('password', this.registerForm.value.password);
    formData.append('email', this.registerForm.value.email);
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.authenticationService
      .register(this.registerForm.value.username, this.registerForm.value.password, this.registerForm.value.email)
      .subscribe(
        (response) => {
          this.isLoading = false;
          if (response) {
            if (this.selectedFile) {
              this.userService.updateProfilePicture(formData).subscribe(
                () => this.router.navigate(["/login"]),
                (error) => {
                  console.log("Profile picture upload error:", error);
                  this.showError = true;
                }
              );
            } else {
              this.router.navigate(["/login"]);
            }
          } else {
            this.showError = true;
          }
        },
        (error) => {
          console.log("Registration error:", error);
          this.isLoading = false;
          this.showError = true;
        }
      );
  }
}