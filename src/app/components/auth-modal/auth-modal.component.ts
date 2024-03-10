import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../services/auth/auth.service';
import { CustomInputComponent } from '../custom-input/custom-input.component';
import { NgIf, NgOptimizedImage } from '@angular/common';
import { UnderlineInputComponent } from '../underline-input/underline-input.component';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ControlErrorCode,
  CustomValidators,
} from '../underline-input/custom-validators';
import { assertUnreachable } from '../../utilities/general.utilities';
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
    CustomInputComponent,
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

  inputInfo = {
    vaildForms: {
      login: true,
      signup: true,
    },
    username: {
      leadingIcon: 'person',
      placeholder: 'Username*',
      type: 'text',
    },
    password: {
      leadingIcon: 'lock',
      placeholder: 'Password*',
      inlineIcon: 'visibility',
      altInlineIcon: 'visibility_off',
      type: 'password',
    },
    email: {
      leadingIcon: 'email',
      placeholder: 'Email address*',
      type: 'email',
    },
  };

  constructor(
    private dialogRef: MatDialogRef<AuthModalComponent>,
    public authService: AuthService,
  ) {}

  handleInputValidation(inputValue: string, inputType: string) {
    switch (inputType) {
      case 'text':
        this.isFormValid = /^[a-zA-Z]+$/.test(inputValue.trim());
        break;
      case 'password':
        this.isFormValid = /^[A-Za-z0-9!@#$^&()_-]+$/.test(inputValue.trim());
        break;
      case 'email':
        this.isFormValid = /@\w+\.\w+/.test(inputValue.trim());
        break;
    }
  }

  determineErrors(form: FormGroup) {
    let formInvalid = false;
    for (const controlName in form.controls) {
      const formControl = form.controls[controlName] as FormControl;
      const errorMsg = this.getInputError(formControl);
      form.controls[controlName].setErrors({ errorMsg });
      if (errorMsg) {
        formInvalid = true;
      }
    }
    return formInvalid;
  }

  getInputError(formControl: FormControl): string {
    const errorCode = formControl.errors
      ? (Object.keys(formControl.errors)[0] as ControlErrorCode)
      : null;
    switch (errorCode) {
      case null:
        return '';
      case ControlErrorCode.ErrorMsg:
        return formControl.errors?.['errorMsg'];
      case ControlErrorCode.Required:
        return 'Field is required';
      case ControlErrorCode.Email:
        return 'Email is invalid';
      case ControlErrorCode.Username:
        return 'Can only use letters';
      case ControlErrorCode.Password:
        return 'Not valid. A-Z and a-z, 0-9, and ! @ # $ ^ & ( ) _ - only';
    }

    // ensures all error codes are handled
    return assertUnreachable(errorCode);
  }

  async handleLogin(event: SubmitEvent) {
    event.preventDefault();
    console.log(this.loginForm.value);
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

  protected readonly Boolean = Boolean;

  loginDisabled() {
    return !(
      this.loginForm.controls.username.value?.trim() &&
      this.loginForm.controls.password.value?.trim()
    );
  }
}
