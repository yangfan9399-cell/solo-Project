import { create } from 'zustand';
import type { User, AuthState, LoginRequest } from '../types';
import { authApi } from '../api/auth';

interface AuthStore extends AuthState {
  login: (data: LoginRequest) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (data: LoginRequest) => {
    const response = await authApi.login(data);
    if (response.success && response.data) {
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
      return { success: true };
    }
    return { success: false, message: response.error || '登录失败' };
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isAuthenticated: true });

        const response = await authApi.getCurrentUser();
        if (response.success && response.data) {
          set({ user: response.data });
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  },

  setUser: (user: User | null) => {
    set({ user });
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },
}));
