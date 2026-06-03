import { request } from './index';
import type { DashboardStats } from '../types';

export const dashboardApi = {
  getStats: () =>
    request<DashboardStats>({
      url: '/dashboard/stats',
      method: 'GET',
    }),
};
