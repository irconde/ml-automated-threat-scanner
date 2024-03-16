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

export enum ResponseType {
  JSON = 'json',
  XML = 'xml',
}

const parseResponse = <ParsedResponse>(
  response: Response,
  type: ResponseType = ResponseType.JSON,
): Promise<ParsedResponse> => {
  switch (type) {
    case ResponseType.JSON:
      return response.json();
    case ResponseType.XML:
      return response.text() as Promise<ParsedResponse>;
  }
};

type ErrorResponse = {
  message: string;
};

export async function customFetch<Request, Response>(
  route: ApiRoutes,
  method: 'GET' | 'POST',
  options?: { data?: Request; type?: ResponseType },
): Promise<Response> {
  const token = await generateToken();

  const response = await fetch(`${BASE_API_URL}${route}`, {
    method: method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    ...(options?.data ? { body: JSON.stringify(options.data) } : {}),
  });

  if (response.status === 200) {
    return await parseResponse<Response>(response, options?.type);
  } else {
    const error = await parseResponse<ErrorResponse | string>(
      response,
      options?.type,
    );
    throw Error(
      (typeof error === 'string' ? error : error.message) ??
        `Failed to fetch ${route} | status code ${response.status}`,
    );
  }
}
