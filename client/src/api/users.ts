import { request } from './index';
import type { User, UserRole } from '../types';

export interface UserQuery {
  role?: string;
  keyword?: string;
}

export const userApi = {
  getList: (params?: UserQuery) =>
    request<User[]>({
      url: '/users',
      method: 'GET',
      params,
    }),

  getDetail: (id: number) =>
    request<User>({
      url: `/users/${id}`,
      method: 'GET',
    }),

  create: (data: Partial<User> & { password: string }) =>
    request<User>({
      url: '/users',
      method: 'POST',
      data,
    }),

  update: (id: number, data: Partial<User> & { password?: string }) =>
    request<User>({
      url: `/users/${id}`,
      method: 'PUT',
      data,
    }),

  delete: (id: number) =>
    request({
      url: `/users/${id}`,
      method: 'DELETE',
    }),

  getByRole: (role: UserRole) =>
    request<User[]>({
      url: `/users/by-role/${role}`,
      method: 'GET',
    }),

  toggleStatus: (id: number) =>
    request<User>({
      url: `/users/${id}/toggle-status`,
      method: 'POST',
    }),
};
