import { request } from './index';
import type { LoginRequest, LoginResponse, User } from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    request<LoginResponse>({
      url: '/auth/login',
      method: 'POST',
      data,
    }),

  getCurrentUser: () =>
    request<User>({
      url: '/auth/me',
      method: 'GET',
    }),

  logout: () =>
    request({
      url: '/auth/logout',
      method: 'POST',
    }),
};
