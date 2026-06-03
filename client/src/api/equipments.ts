import { request } from './index';
import type { Equipment, ScheduleItem } from '../types';

export interface EquipmentQuery {
  category?: string;
  status?: string;
  keyword?: string;
}

export const equipmentApi = {
  getList: (params?: EquipmentQuery) =>
    request<Equipment[]>({
      url: '/equipments',
      method: 'GET',
      params,
    }),

  getDetail: (id: number) =>
    request<Equipment>({
      url: `/equipments/${id}`,
      method: 'GET',
    }),

  create: (data: Partial<Equipment>) =>
    request<Equipment>({
      url: '/equipments',
      method: 'POST',
      data,
    }),

  update: (id: number, data: Partial<Equipment>) =>
    request<Equipment>({
      url: `/equipments/${id}`,
      method: 'PUT',
      data,
    }),

  delete: (id: number) =>
    request({
      url: `/equipments/${id}`,
      method: 'DELETE',
    }),

  getSchedule: (id: number, params?: { start_date?: string; end_date?: string }) =>
    request<ScheduleItem[]>({
      url: `/equipments/${id}/schedule`,
      method: 'GET',
      params,
    }),
};
