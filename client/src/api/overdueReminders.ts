import { request } from './index';
import type { OverdueReminder } from '../types';

export interface OverdueReminderQuery {
  status?: string;
  type?: string;
}

export const overdueReminderApi = {
  getList: (params?: OverdueReminderQuery) =>
    request<OverdueReminder[]>({
      url: '/overdue-reminders',
      method: 'GET',
      params,
    }),

  refresh: () =>
    request({
      url: '/overdue-reminders/refresh',
      method: 'POST',
    }),

  notify: (id: number) =>
    request<OverdueReminder>({
      url: `/overdue-reminders/${id}/notify`,
      method: 'POST',
    }),

  resolve: (id: number) =>
    request<OverdueReminder>({
      url: `/overdue-reminders/${id}/resolve`,
      method: 'POST',
    }),

  getStats: () =>
    request<{ total: number; pending: number; notified: number; resolved: number }>({
      url: '/overdue-reminders/stats/count',
      method: 'GET',
    }),

  batchNotify: (ids: number[]) =>
    request({
      url: '/overdue-reminders/batch-notify',
      method: 'POST',
      data: { ids },
    }),
};
