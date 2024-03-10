import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../services/auth/auth.service';
import { NgIf, NgOptimizedImage } from '@angular/common';
import { UnderlineInputComponent } from '../underline-input/underline-input.component';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CustomValidators } from '../underline-input/custom-validators';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.scss'],
  standalone: true,
  imports: [
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    NgOptimizedImage,
    NgIf,
    UnderlineInputComponent,
    ReactiveFormsModule,
  ],
})
export class AuthModalComponent {
  isFormValid = true;
  isLoading = false;
  signUpError = '';
  loginFormError = '';
  loginForm = new FormGroup({
    username: new FormControl('', {
      validators: [Validators.required, CustomValidators.username()],
    }),
    password: new FormControl('', {
      validators: [Validators.required, CustomValidators.password()],
    }),
  });
  registerForm = new FormGroup({
    username: new FormControl('', {
      validators: [Validators.required, CustomValidators.username()],
    }),
    email: new FormControl('', {
      validators: [Validators.required, CustomValidators.email()],
    }),
    password: new FormControl('', {
      validators: [Validators.required, CustomValidators.password()],
    }),
  });

  constructor(
    private dialogRef: MatDialogRef<AuthModalComponent>,
    public authService: AuthService,
  ) {}

  determineErrors(form: FormGroup) {
    let formInvalid = false;
    for (const controlName in form.controls) {
      const formControl = form.controls[controlName] as FormControl;
      const errorMsg = CustomValidators.getInputError(formControl);
      form.controls[controlName].setErrors({ errorMsg });
      if (errorMsg) {
        formInvalid = true;
      }
    }
    return formInvalid;
  }

  async handleLogin(event: SubmitEvent) {
    event.preventDefault();
    if (this.determineErrors(this.loginForm)) {
      return;
    }

    this.loginFormError = '';
    this.isLoading = true;

    try {
      const { username, password } = this.loginForm.value;
      await this.authService.login(username!, password!);
      this.dialogRef.close();
    } catch (e) {
      const errorMsg = (e as Error).message;
      this.loginFormError = errorMsg;
      if (errorMsg.toLowerCase().includes('user')) {
        this.loginForm.controls.username.setErrors({ errorMsg });
      } else if (errorMsg.toLowerCase().includes('password')) {
        this.loginForm.controls.password.setErrors({ errorMsg });
      }
    } finally {
      this.isLoading = false;
    }
  }

  async handleSignup(event: SubmitEvent) {
    event.preventDefault();

    if (this.isFormValid) {
      this.signUpError = '';
      this.isLoading = true;
      try {
        await this.authService.register();
      } catch (e) {
        // TOOD: handler errors
      } finally {
        this.isLoading = false;
      }
    }
  }

  loginDisabled() {
    return !(
      this.loginForm.controls.username.value?.trim() &&
      this.loginForm.controls.password.value?.trim()
    );
  }
}
