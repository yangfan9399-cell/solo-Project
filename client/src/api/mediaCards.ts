import { request } from './index';
import type { MediaCard, MediaCardRecord } from '../types';

export interface MediaCardQuery {
  status?: string;
  type?: string;
  keyword?: string;
  equipment_id?: number;
}

export const mediaCardApi = {
  getList: (params?: MediaCardQuery) =>
    request<MediaCard[]>({
      url: '/media-cards',
      method: 'GET',
      params,
    }),

  getDetail: (id: number) =>
    request<MediaCard & { history: MediaCardRecord[] }>({
      url: `/media-cards/${id}`,
      method: 'GET',
    }),

  create: (data: Partial<MediaCard>) =>
    request<MediaCard>({
      url: '/media-cards',
      method: 'POST',
      data,
    }),

  update: (id: number, data: Partial<MediaCard>) =>
    request<MediaCard>({
      url: `/media-cards/${id}`,
      method: 'PUT',
      data,
    }),

  delete: (id: number) =>
    request({
      url: `/media-cards/${id}`,
      method: 'DELETE',
    }),

  borrow: (id: number, data: {
    user_id: number;
    user_name: string;
    expected_return_time: string;
    reservation_id?: number;
    remark?: string;
  }) =>
    request<MediaCard>({
      url: `/media-cards/${id}/borrow`,
      method: 'POST',
      data,
    }),

  return: (id: number, data?: {
    return_remark?: string;
    return_status?: 'normal' | 'damaged';
    damage_description?: string;
    actual_return_time?: string;
  }) =>
    request<MediaCard & { damage_report_id?: number }>({
      url: `/media-cards/${id}/return`,
      method: 'POST',
      data,
    }),
};
