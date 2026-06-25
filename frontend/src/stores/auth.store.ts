import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth.api';
import type { AuthResponse } from '../api/auth.api';
import { useOrgStore } from './org.store';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (data: AuthResponse) => {
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        const { refreshToken } = get();
        if (refreshToken) {
          authApi.logout(refreshToken).catch(() => {});
        }
        useOrgStore.getState().reset();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) throw new Error('No refresh token');
        const data = await authApi.refresh(refreshToken);
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          isAuthenticated: true,
        });
      },

      updateUser: (partial: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...partial } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
