export interface User {
  username: string;
  email: string;
}

export type LoginRequest = {
  username: string;
  password: string;
};

export interface AuthResponse extends User {
  Success: boolean;
}
