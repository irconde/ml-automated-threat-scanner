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
  ],
})
export class AuthModalComponent {
  isFormValid = true;
  isLoading = false;
  signUpError = '';
  loginError = '';

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

  errorHashMap: { [key: string]: string } = {};

  constructor(public authService: AuthService) {
    this.errorHashMap = {
      username: 'The user does not exist',
      password: 'The password is incorrect',
    };
  }

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

  async handleLogin(event: SubmitEvent) {
    event.preventDefault();

    if (this.isFormValid) {
      this.loginError = '';
      this.isLoading = true;

      try {
        await this.authService.login();
      } catch (e) {
        console.log(e);
        if ((e as Error).message.includes('user')) {
          this.loginError = this.errorHashMap['username'];
          console.log(this.loginError);
        } else if ((e as Error).message.includes('password')) {
          this.loginError = this.errorHashMap['password'];
          console.log(this.loginError);
        }
      } finally {
        this.isLoading = false;
      }
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
        console.log(e);
        if ((e as Error).message.includes('password')) {
          this.signUpError = this.errorHashMap['password'];
          console.log(this.signUpError);
        }
      } finally {
        this.isLoading = false;
      }
    }
  }
}
