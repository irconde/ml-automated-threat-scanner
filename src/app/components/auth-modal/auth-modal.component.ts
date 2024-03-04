import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../services/auth/auth.service';

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
  ],
})
export class AuthModalComponent {
  hide = true;
  isLoading = false;
  error = '';

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
}
