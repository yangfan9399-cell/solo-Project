import { request } from './index';
import type { ShootingTask } from '../types';

export interface TaskQuery {
  status?: string;
  reporter_id?: number;
  keyword?: string;
}

export const taskApi = {
  getList: (params?: TaskQuery) =>
    request<ShootingTask[]>({
      url: '/tasks',
      method: 'GET',
      params,
    }),

  getDetail: (id: number) =>
    request<ShootingTask>({
      url: `/tasks/${id}`,
      method: 'GET',
    }),

  create: (data: Partial<ShootingTask>) =>
    request<ShootingTask>({
      url: '/tasks',
      method: 'POST',
      data,
    }),

  update: (id: number, data: Partial<ShootingTask>) =>
    request<ShootingTask>({
      url: `/tasks/${id}`,
      method: 'PUT',
      data,
    }),

  delete: (id: number) =>
    request({
      url: `/tasks/${id}`,
      method: 'DELETE',
    }),

  submit: (id: number) =>
    request<ShootingTask>({
      url: `/tasks/${id}/submit`,
      method: 'POST',
    }),

  approve: (id: number, data?: { remark?: string }) =>
    request<ShootingTask>({
      url: `/tasks/${id}/approve`,
      method: 'POST',
      data,
    }),

  reject: (id: number, data?: { remark?: string }) =>
    request<ShootingTask>({
      url: `/tasks/${id}/reject`,
      method: 'POST',
      data,
    }),

  start: (id: number) =>
    request<ShootingTask>({
      url: `/tasks/${id}/start`,
      method: 'POST',
    }),

  complete: (id: number) =>
    request<ShootingTask>({
      url: `/tasks/${id}/complete`,
      method: 'POST',
    }),

  cancel: (id: number) =>
    request<ShootingTask>({
      url: `/tasks/${id}/cancel`,
      method: 'POST',
    }),
};
