import axios from 'axios';
import type {
  User,
  WorkOrder,
  OverviewStats,
  ReworkByReason,
  ReworkByDepartment,
  ReworkByConclusion,
  RepeatRework,
  ReworkTimeDistribution,
  ArchiveValidation,
  HandoverRecord,
  QualityInspection,
  ReworkRecord
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message;
    return Promise.reject(new Error(message));
  }
);

export const healthCheck = () => api.get<any, { status: string; timestamp: string }>('/health');

export const getUsers = () => api.get<any, User[]>('/users');

export const getWorkOrders = () => api.get<any, WorkOrder[]>('/work-orders');

export const getWorkOrder = (id: string) => api.get<any, WorkOrder>(`/work-orders/${id}`);

export const validateArchive = (orderId: string) =>
  api.post<any, ArchiveValidation>(`/work-orders/${orderId}/validate-archive`);

export interface HandoverRequest {
  workOrderId: string;
  processId: string;
  operatorId: string;
  handoverNote: string;
  quantity: number;
}

export const submitHandover = (data: HandoverRequest) =>
  api.post<any, HandoverRecord>('/handover', data);

export interface QualityRequest {
  handoverId: string;
  inspectorId: string;
  decision: 'PASS' | 'REJECT' | 'ARCHIVE';
  evidence?: string;
  rejectReason?: string;
}

export const submitQuality = (data: QualityRequest) =>
  api.post<any, QualityInspection>('/quality', data);

export interface ReworkRequest {
  processId: string;
  operatorId: string;
  reworkReason: string;
  reworkMaterials: string;
  reworkNote?: string;
  reworkConclusion?: 'REPAIRED' | 'SCRAPPED' | 'CONCESSION';
}

export const submitRework = (data: ReworkRequest) =>
  api.post<any, ReworkRecord>('/rework', data);

export interface ReworkCompleteRequest {
  reworkConclusion: 'REPAIRED' | 'SCRAPPED' | 'CONCESSION';
  reworkNote?: string;
}

export const completeRework = (reworkId: string, data: ReworkCompleteRequest) =>
  api.put<any, ReworkRecord>(`/rework/${reworkId}/complete`, data);

export const getOverviewStats = () =>
  api.get<any, OverviewStats>('/statistics/overview');

export const getReworkByReason = () =>
  api.get<any, ReworkByReason[]>('/statistics/rework-by-reason');

export const getReworkByDepartment = () =>
  api.get<any, ReworkByDepartment[]>('/statistics/rework-by-department');

export const getReworkByConclusion = () =>
  api.get<any, ReworkByConclusion[]>('/statistics/rework-by-conclusion');

export const getRepeatReworks = () =>
  api.get<any, RepeatRework[]>('/statistics/repeat-reworks');

export const getReworkTimeDistribution = () =>
  api.get<any, ReworkTimeDistribution[]>('/statistics/rework-time-distribution');

export default api;
