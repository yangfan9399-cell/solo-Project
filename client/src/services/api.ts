import axios from 'axios';
import type {
  User,
  WaterQualityTest,
  RepairReport,
  WorkOrder,
  WaterStopNotice,
  Location,
  RepairTeam,
  Notification,
  RecheckRecord,
  DashboardData,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: Partial<User>) => api.post<User>('/users', data),
  update: (id: string, data: Partial<User>) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const locationsApi = {
  getAll: (type?: string) => api.get<Location[]>('/locations', { params: { type } }),
  getById: (id: string) => api.get<Location>(`/locations/${id}`),
  create: (data: Partial<Location>) => api.post<Location>('/locations', data),
  update: (id: string, data: Partial<Location>) => api.put<Location>(`/locations/${id}`, data),
  delete: (id: string) => api.delete(`/locations/${id}`),
};

export const repairTeamsApi = {
  getAll: (status?: string) => api.get<RepairTeam[]>('/repair-teams', { params: { status } }),
  getById: (id: string) => api.get<RepairTeam>(`/repair-teams/${id}`),
  create: (data: Partial<RepairTeam>) => api.post<RepairTeam>('/repair-teams', data),
  update: (id: string, data: Partial<RepairTeam>) => api.put<RepairTeam>(`/repair-teams/${id}`, data),
  updateStatus: (id: string, status: string) => api.put<RepairTeam>(`/repair-teams/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/repair-teams/${id}`),
};

export const waterQualityApi = {
  getAll: (status?: string) => api.get<WaterQualityTest[]>('/water-quality', { params: { status } }),
  getById: (id: string) => api.get<WaterQualityTest & { rechecks: RecheckRecord[] }>(`/water-quality/${id}`),
  create: (data: Partial<WaterQualityTest>) => api.post<WaterQualityTest>('/water-quality', data),
  updateStatus: (id: string, status: string) => api.put<WaterQualityTest>(`/water-quality/${id}/status`, { status }),
  recheck: (id: string, data: Partial<RecheckRecord>) => api.post<RecheckRecord>(`/water-quality/${id}/recheck`, data),
};

export const repairReportsApi = {
  getAll: (status?: string, urgency?: string) => api.get<RepairReport[]>('/repair-reports', { params: { status, urgency } }),
  getById: (id: string) => api.get<RepairReport & { work_orders: WorkOrder[] }>(`/repair-reports/${id}`),
  create: (data: Partial<RepairReport>) => api.post<RepairReport>('/repair-reports', data),
  update: (id: string, data: Partial<RepairReport>) => api.put<RepairReport>(`/repair-reports/${id}`, data),
  updateStatus: (id: string, status: string) => api.put<RepairReport>(`/repair-reports/${id}/status`, { status }),
  assign: (id: string, teamId: string, teamName: string) => api.put<RepairReport>(`/repair-reports/${id}/assign`, { team_id: teamId, team_name: teamName }),
  delete: (id: string) => api.delete(`/repair-reports/${id}`),
};

export const workOrdersApi = {
  getAll: (status?: string, teamId?: string) => api.get<WorkOrder[]>('/work-orders', { params: { status, team_id: teamId } }),
  getById: (id: string) => api.get<WorkOrder & { repair_report: RepairReport }>(`/work-orders/${id}`),
  update: (id: string, data: Partial<WorkOrder>) => api.put<WorkOrder>(`/work-orders/${id}`, data),
  updateStatus: (id: string, status: string, workSummary?: string, materialsUsed?: string) =>
    api.put<WorkOrder>(`/work-orders/${id}/status`, { status, work_summary: workSummary, materials_used: materialsUsed }),
};

export const waterStopNoticesApi = {
  getAll: (published?: boolean) => api.get<WaterStopNotice[]>('/water-stop-notices', { params: { published } }),
  getById: (id: string) => api.get<WaterStopNotice>(`/water-stop-notices/${id}`),
  create: (data: Partial<WaterStopNotice>) => api.post<WaterStopNotice>('/water-stop-notices', data),
  update: (id: string, data: Partial<WaterStopNotice>) => api.put<WaterStopNotice>(`/water-stop-notices/${id}`, data),
  publish: (id: string) => api.put<WaterStopNotice>(`/water-stop-notices/${id}/publish`),
  end: (id: string) => api.put<WaterStopNotice>(`/water-stop-notices/${id}/end`),
  delete: (id: string) => api.delete(`/water-stop-notices/${id}`),
};

export const notificationsApi = {
  getAll: (role?: string, unreadOnly?: boolean) => api.get<Notification[]>('/notifications', { params: { role, unread: unreadOnly } }),
  markAsRead: (id: string) => api.put<Notification>(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const dashboardApi = {
  getDashboard: () => api.get<DashboardData>('/dashboard'),
};

export default api;
