import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const requestUrl = String(original?.url ?? '');
    const isAuthRequest = /\/auth\/(login|register)(?:\?|$)/.test(requestUrl);

    if (error.response?.status === 401 && !original._retry && !isAuthRequest) {
      original._retry = true;
      try {
        await useAuthStore.getState().refreshAccessToken();
        const newToken = useAuthStore.getState().accessToken;
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
