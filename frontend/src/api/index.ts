import axios from 'axios';
import type {
  Station,
  StationStatus,
  DispatchOrder,
  DispatchStatus,
  DispatchSampleType,
  RepairOrder,
  RepairStatus,
  FaultType,
  HistoryNode,
  User,
  UserRole,
  OverallStats,
  DistrictStats,
  FaultTypeStats,
  ResponseTimeStats,
} from '@/types';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const stationApi = {
  findAll: (district?: string, status?: StationStatus): Promise<Station[]> =>
    request.get('/stations', { params: { district, status } }),

  findOne: (id: string): Promise<Station> =>
    request.get(`/stations/${id}`),

  findByCode: (code: string): Promise<Station> =>
    request.get(`/stations/code/${code}`),

  validateCode: (stationCode: string): Promise<{ valid: boolean; station?: Station; message?: string }> =>
    request.post('/stations/validate-code', { stationCode }),

  getDistricts: (): Promise<string[]> =>
    request.get('/stations/districts'),

  getLowStockStations: (): Promise<Station[]> =>
    request.get('/stations/low-stock'),

  create: (data: Partial<Station>): Promise<Station> =>
    request.post('/stations', data),

  update: (id: string, data: Partial<Station>): Promise<Station> =>
    request.put(`/stations/${id}`, data),
};

export const dispatchApi = {
  findAll: (status?: DispatchStatus, sampleType?: DispatchSampleType, stationId?: string): Promise<DispatchOrder[]> =>
    request.get('/dispatch-orders', { params: { status, sampleType, stationId } }),

  findOne: (id: string): Promise<DispatchOrder> =>
    request.get(`/dispatch-orders/${id}`),

  getHistory: (id: string): Promise<HistoryNode[]> =>
    request.get(`/dispatch-orders/${id}/history`),

  create: (data: {
    stationCode?: string;
    stationId?: string;
    reportedStationCode?: string;
    requiredQuantity: number;
    sampleType?: DispatchSampleType;
    remark?: string;
  }): Promise<DispatchOrder> =>
    request.post('/dispatch-orders', data),

  assignDispatcher: (id: string, data: {
    dispatcherId: string;
    dispatcherName: string;
    dispatchedQuantity: number;
  }): Promise<DispatchOrder> =>
    request.put(`/dispatch-orders/${id}/assign`, data),

  arriveStation: (id: string, data?: { arrivedAt?: string }): Promise<DispatchOrder> =>
    request.put(`/dispatch-orders/${id}/arrive`, data),

  markAsPendingReview: (id: string): Promise<DispatchOrder> =>
    request.put(`/dispatch-orders/${id}/pending-review`),

  rebindStation: (id: string, newStationCode: string): Promise<DispatchOrder> =>
    request.put(`/dispatch-orders/${id}/rebind-station`, { newStationCode }),

  reviewPass: (id: string, data: { reviewerId: string; reviewerName: string }): Promise<DispatchOrder> =>
    request.put(`/dispatch-orders/${id}/review-pass`, data),

  reviewReturn: (id: string, data: { reviewerId: string; reviewerName: string; reason: string }): Promise<DispatchOrder> =>
    request.put(`/dispatch-orders/${id}/review-return`, data),
};

export const repairApi = {
  findAll: (status?: RepairStatus, faultType?: FaultType): Promise<RepairOrder[]> =>
    request.get('/repair-orders', { params: { status, faultType } }),

  findOne: (id: string): Promise<RepairOrder> =>
    request.get(`/repair-orders/${id}`),

  findByDispatchOrderId: (dispatchOrderId: string): Promise<RepairOrder> =>
    request.get(`/repair-orders/dispatch/${dispatchOrderId}`),

  create: (data: {
    dispatchOrderId: string;
    bikeId?: string;
    bikeCode?: string;
    faultType: FaultType;
    faultDescription: string;
    evidenceImages?: string[];
    repairerId: string;
    repairerName: string;
  }): Promise<RepairOrder> =>
    request.post('/repair-orders', data),

  startRepair: (id: string, data: { repairerId: string; repairerName: string }): Promise<RepairOrder> =>
    request.put(`/repair-orders/${id}/start`, data),

  completeRepair: (id: string, data: { repairRemark: string; cannotRepair?: boolean }): Promise<RepairOrder> =>
    request.put(`/repair-orders/${id}/complete`, data),
};

export const analyticsApi = {
  getOverallStats: (): Promise<OverallStats> =>
    request.get('/analytics/overall'),

  getDistrictStats: (): Promise<DistrictStats[]> =>
    request.get('/analytics/district'),

  getFaultTypeStats: (): Promise<FaultTypeStats[]> =>
    request.get('/analytics/fault-type'),

  getResponseTimeStats: (): Promise<ResponseTimeStats[]> =>
    request.get('/analytics/response-time'),
};

export const userApi = {
  findAll: (role?: UserRole): Promise<User[]> =>
    request.get('/users', { params: { role } }),

  findOne: (id: string): Promise<User> =>
    request.get(`/users/${id}`),

  getDispatchers: (): Promise<User[]> =>
    request.get('/users/dispatchers'),

  getRepairers: (): Promise<User[]> =>
    request.get('/users/repairers'),

  getReviewers: (): Promise<User[]> =>
    request.get('/users/reviewers'),

  create: (data: Partial<User>): Promise<User> =>
    request.post('/users', data),
};
