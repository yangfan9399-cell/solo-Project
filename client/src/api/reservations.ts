import { request } from './index';
import type { Reservation, ScheduleItem, Equipment } from '../types';

export interface ReservationQuery {
  status?: string;
  equipment_id?: number;
  requester_id?: number;
  keyword?: string;
}

export const reservationApi = {
  getList: (params?: ReservationQuery) =>
    request<Reservation[]>({
      url: '/reservations',
      method: 'GET',
      params,
    }),

  getDetail: (id: number) =>
    request<Reservation>({
      url: `/reservations/${id}`,
      method: 'GET',
    }),

  create: (data: Partial<Reservation>) =>
    request<Reservation>({
      url: '/reservations',
      method: 'POST',
      data,
    }),

  update: (id: number, data: Partial<Reservation>) =>
    request<Reservation>({
      url: `/reservations/${id}`,
      method: 'PUT',
      data,
    }),

  approve: (id: number, data?: { remark?: string }) =>
    request<Reservation>({
      url: `/reservations/${id}/approve`,
      method: 'POST',
      data,
    }),

  reject: (id: number, data?: { remark?: string }) =>
    request<Reservation>({
      url: `/reservations/${id}/reject`,
      method: 'POST',
      data,
    }),

  pickup: (id: number) =>
    request<Reservation>({
      url: `/reservations/${id}/pickup`,
      method: 'POST',
    }),

  return: (id: number, data?: { return_remark?: string }) =>
    request<Reservation>({
      url: `/reservations/${id}/return`,
      method: 'POST',
      data,
    }),

  cancel: (id: number) =>
    request<Reservation>({
      url: `/reservations/${id}/cancel`,
      method: 'POST',
    }),

  getCalendar: (params?: { start_date?: string; end_date?: string; category?: string }) =>
    request<{ schedule: ScheduleItem[]; equipments: Equipment[] }>({
      url: '/reservations/calendar/all',
      method: 'GET',
      params,
    }),
};
