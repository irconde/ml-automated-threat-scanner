import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiRoutes, customFetch } from '../../utilities/api/api.routes';
import {
  AuthResponse,
  LoginRequest,
  User,
} from '../../utilities/api/user-api.types';
import { SettingsService } from '../settings/settings.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user = new BehaviorSubject<User | null>(null);
  private isLoading = new BehaviorSubject(true);
  public $user = this.user.asObservable();
  public $isLoading = this.isLoading.asObservable();

  constructor(
    private settingsService: SettingsService, // private dialogService: MatDialog,
  ) {
    const subscription = this.settingsService
      .getSettings()
      .subscribe((settings) => {
        if (!settings) return;
        // If the user was logged in before, check if the cookie is still valid
        if (settings.wasLoggedInBefore) {
          this.checkIfCookieValid().finally(() => {
            this.isLoading.next(false);
          });
        } else {
          this.isLoading.next(false);
        }
        subscription.unsubscribe();
      });
  }

  async login(username: string, password: string): Promise<void> {
    const authResponse = await customFetch<LoginRequest, AuthResponse>(
      ApiRoutes.Login,
      'POST',
      { username, password },
    );
    this.user.next({
      username: authResponse.username,
      email: authResponse.email,
    });
    await this.settingsService.toggleIsLoggedIn();
  }

  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<void> {
    //   TODO: Implement
    // TODO: Make sure to call this.settingsService.toggleIsLoggedIn() after successful registration
    console.log('Registered');
  }

  private async checkIfCookieValid() {
    const authResponse = await customFetch<undefined, AuthResponse>(
      ApiRoutes.CheckAuth,
      'GET',
    );
    this.user.next({
      username: authResponse.username,
      email: authResponse.email,
    });
  }

  async logout(): Promise<void> {
    await customFetch(ApiRoutes.Logout, 'POST');
    this.user.next(null);
    await this.settingsService.toggleIsLoggedIn();
  }
}
