import { Injectable } from '@angular/core';
import fetch from 'cross-fetch';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

  async login(): Promise<void> {
    const token = await this.generateToken();

    const response = await fetch('http://localhost:8080/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ username: 'test', password: 'test' }),
    });

    if (response.status === 200) {
      const jsonBody = await response.json();
      console.log(jsonBody);
    }
  }

  async generateToken(): Promise<string> {
    // TODO: Get from ENV
    const clientId = 'test';
    const clientSecret = 'test';

    const details = {
      scope: 'read',
      grant_type: 'client_credentials',
    };

    const formBody = Object.keys(details)
      .map(
        (key) =>
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          encodeURIComponent(key) + '=' + encodeURIComponent(details[key]),
      )
      .join('&');

    const base64Credentials = btoa(`${clientId}:${clientSecret}`);

    try {
      const response = await fetch('http://localhost:8080/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + base64Credentials,
        },
        body: formBody,
      });
      if (response.status === 200) {
        const jsonBody = await response.json();
        console.log(jsonBody);
        console.log(`Token: ${jsonBody.access_token}`);
        return jsonBody.access_token as string;
      }
    } catch (e) {
      console.log(e);
    }
    return '';
  }
}
