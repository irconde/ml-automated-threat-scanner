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
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

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
  loginUsername = new FormControl('', { validators: [Validators.required] });
  loginPassword = new FormControl('', { validators: [Validators.required] });

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

  constructor(public authService: AuthService) {}

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

  invalidFields(...fields: FormControl[]) {
    return fields.some((field) => Boolean(field));
  }

  errorCodeToMsg(errors: ValidationErrors) {
    const errorCode = Object.keys(errors)[0];
    switch (errorCode) {
      case 'required':
        return 'Field is required';
      case 'api':
        return errors[errorCode];
      default:
        return 'Error';
    }
  }

  getInputError(formControl: FormControl) {
    return formControl.errors ? this.errorCodeToMsg(formControl.errors) : '';
  }

  async handleLogin(event: SubmitEvent) {
    event.preventDefault();
    if (this.invalidFields(this.loginUsername, this.loginPassword)) {
      return;
    }

    this.loginFormError = '';
    this.isLoading = true;

    try {
      // TODO: provide user input for credentials here
      await this.authService.login(
        this.loginUsername.value!,
        this.loginPassword.value!,
      );
    } catch (e) {
      const errorMsg = (e as Error).message;
      if (errorMsg.toLowerCase().includes('user')) {
        this.loginUsername.setErrors({ api: errorMsg });
      } else if (errorMsg.toLowerCase().includes('password')) {
        this.loginPassword.setErrors({ api: errorMsg });
      } else {
        // TODO: display error in form
        this.loginFormError = errorMsg;
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
}
