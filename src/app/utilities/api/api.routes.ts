import { generateToken } from './generateToken';
import fetch from 'cross-fetch';

const BASE_API_URL = 'http://localhost:8080';

export enum ApiRoutes {
  Token = '/token',
  CheckAuth = '/auth',
  Login = '/auth/login',
  Register = '/auth/register',
  Logout = '/auth/logout',
}

export async function customFetch<Request, Response>(
  route: ApiRoutes,
  method: 'GET' | 'POST',
  data?: Request,
): Promise<Response> {
  const token = await generateToken();

  const response = await fetch(`${BASE_API_URL}${route}`, {
    method: method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });

  if (response.status === 200) {
    return await response.json();
  } else
    throw Error(`Failed to fetch ${route} | status code ${response.status}`);
}
