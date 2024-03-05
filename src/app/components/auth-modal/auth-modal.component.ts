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
  ],
})
export class AuthModalComponent {
  hide = true;
  isLoading = false;
  error = '';

  inputInfo = {
    username: {
      leadingIcon: 'person',
      placeholder: 'Username*',
    },
    password: {
      leadingIcon: 'lock',
      placeholder: 'Password*',
      inlineIcon: 'visibility',
      altInlineIcon: 'visibility_off',
    },
    email: {
      leadingIcon: 'email',
      placeholder: 'Email address*',
    },
  };

  constructor(public authService: AuthService) {}

  async handleLogin(event: SubmitEvent) {
    event.preventDefault();
    this.error = '';
    this.isLoading = true;
    try {
      await this.authService.login();
    } catch (e) {
      console.log(e);
      this.error = (e as Error).message;
    } finally {
      this.isLoading = false;
    }
  }

  async handleSignup(event: SubmitEvent) {
    event.preventDefault();
    this.error = '';
    this.isLoading = true;
    try {
      await this.authService.register();
    } catch (e) {
      console.log(e);
      this.error = (e as Error).message;
    } finally {
      this.isLoading = false;
    }
  }
}
