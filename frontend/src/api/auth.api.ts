import { apiClient } from './client';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
  };
}

export const authApi = {
  register: (data: RegisterData) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: LoginData) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient
      .post<AuthResponse>('/auth/refresh', { refreshToken })
      .then((r) => r.data),

  logout: (refreshToken?: string) =>
    apiClient.post('/auth/logout', { refreshToken }),
};
