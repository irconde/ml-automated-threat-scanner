import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiRoutes, customFetch } from '../../utilities/api/api.routes';
import {
  AuthResponse,
  LoginRequest,
  User,
} from '../../utilities/api/user-api.types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user = new BehaviorSubject<User | null>(null);
  public $user = this.user.asObservable();

  constructor() {
    this.checkIfLoggedIn().then();
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
  }

  async register(): Promise<void> {
    //   TODO: Implement
    console.log('Registered');
  }

  private async checkIfLoggedIn() {
    const authResponse = await customFetch<undefined, AuthResponse>(
      ApiRoutes.CheckAuth,
      'GET',
    );
    this.user.next({
      username: authResponse.username,
      email: authResponse.email,
    });
  }
}
