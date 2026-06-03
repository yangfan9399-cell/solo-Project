import { request } from './index';
import type { DamageReport } from '../types';

export interface DamageReportQuery {
  status?: string;
  equipment_id?: number;
  damage_type?: string;
  reporter_id?: number;
  keyword?: string;
}

export const damageReportApi = {
  getList: (params?: DamageReportQuery) =>
    request<DamageReport[]>({
      url: '/damage-reports',
      method: 'GET',
      params,
    }),

  getDetail: (id: number) =>
    request<DamageReport>({
      url: `/damage-reports/${id}`,
      method: 'GET',
    }),

  create: (data: Partial<DamageReport>) =>
    request<DamageReport>({
      url: '/damage-reports',
      method: 'POST',
      data,
    }),

  update: (id: number, data: Partial<DamageReport>) =>
    request<DamageReport>({
      url: `/damage-reports/${id}`,
      method: 'PUT',
      data,
    }),

  startRepair: (id: number) =>
    request<DamageReport>({
      url: `/damage-reports/${id}/start-repair`,
      method: 'POST',
    }),

  complete: (id: number, data?: { repair_cost?: number; repair_result?: string }) =>
    request<DamageReport>({
      url: `/damage-reports/${id}/complete`,
      method: 'POST',
      data,
    }),

  scrap: (id: number, data?: { repair_cost?: number; repair_result?: string }) =>
    request<DamageReport>({
      url: `/damage-reports/${id}/scrap`,
      method: 'POST',
      data,
    }),
};
