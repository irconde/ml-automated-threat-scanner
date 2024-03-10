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
import { CustomValidators } from '../../utilities/custom-validators';
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
  isLoading = false;
  loginFormError = '';
  loginForm = new FormGroup({
    username: new FormControl('', {
      validators: [Validators.required, CustomValidators.username()],
    }),
    password: new FormControl('', {
      validators: [Validators.required, CustomValidators.password()],
    }),
  });
  registerFormError = '';
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

  /**
   * Determines if a form has any errors. If any field has an error, a message is set
   * under the errorMsg key in the 'control.errors' object
   * @param form
   * @returns true if form is invalid
   */
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

  async handleRegister(event: SubmitEvent) {
    event.preventDefault();

    if (this.determineErrors(this.registerForm)) {
      return;
    }

    this.registerFormError = '';
    this.isLoading = true;

    try {
      const { username, email, password } = this.registerForm.value;
      await this.authService.register(username!, email!, password!);
      this.dialogRef.close();
    } catch (e) {
      const errorMsg = (e as Error).message;
      this.registerFormError = errorMsg;
      if (errorMsg.toLowerCase().includes('user')) {
        this.registerForm.controls.username.setErrors({ errorMsg });
      } else if (errorMsg.toLowerCase().includes('password')) {
        this.registerForm.controls.password.setErrors({ errorMsg });
      } else if (errorMsg.toLowerCase().includes('email')) {
        this.registerForm.controls.email.setErrors({ errorMsg });
      }
    } finally {
      this.isLoading = false;
    }
  }

  formDisabled(form: FormGroup) {
    return Object.keys(form.controls).some((controlName) => {
      return !form.controls[controlName].value?.trim();
    });
  }
}
