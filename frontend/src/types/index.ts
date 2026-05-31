export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface User {
  id: string;
  username: string;
  real_name: string;
  role: UserRole;
  phone?: string;
  created_at: string;
}

export type UserRole = 'cold_chain_admin' | 'cdc_reviewer' | 'vaccination_site_manager';

export const UserRoleLabels: Record<UserRole, string> = {
  cold_chain_admin: '冷链管理员',
  cdc_reviewer: '疾控复核员',
  vaccination_site_manager: '接种点负责人',
};

export interface ColdStorage {
  id: string;
  name: string;
  code: string;
  location: string;
  capacity: number;
  min_temp: number;
  max_temp: number;
  status: 'normal' | 'maintenance' | 'decommissioned';
  created_at: string;
}

export interface TransportBox {
  id: string;
  name: string;
  code: string;
  model?: string;
  capacity: number;
  min_temp: number;
  max_temp: number;
  current_location?: string;
  status: 'idle' | 'in_transit' | 'maintenance';
  created_at: string;
}

export interface VaccineBatch {
  id: string;
  batch_no: string;
  vaccine_name: string;
  manufacturer: string;
  production_date: string;
  expiry_date: string;
  total_quantity: number;
  available_quantity: number;
  storage_location_type: 'cold_storage' | 'transport_box' | 'vaccination_site';
  storage_location_id: string;
  current_location?: string;
  status: 'normal' | 'quarantined' | 'released' | 'recalled' | 'destroyed';
  created_at: string;
}

export interface TemperatureRecord {
  id: string;
  device_type: 'cold_storage' | 'transport_box';
  device_id: string;
  temperature: number;
  recorded_at: string;
  is_normal: boolean;
}

export interface TemperatureDeviation {
  id: string;
  device_type: 'cold_storage' | 'transport_box';
  device_id: string;
  device_name: string;
  deviation_type: 'over_temp' | 'under_temp' | 'fluctuation';
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  max_temp?: number;
  min_temp?: number;
  avg_temp?: number;
  affected_batches?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'processing' | 'verified' | 'resolved' | 'closed';
  handler_id?: string;
  description?: string;
  created_at: string;
}

export const RiskLevelLabels: Record<string, string> = {
  critical: '极高风险',
  high: '高风险',
  medium: '中风险',
  low: '低风险',
};

export const RiskLevelColors: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-green-500 text-white',
};

export const DeviationStatusLabels: Record<string, string> = {
  detected: '已发现',
  processing: '处理中',
  verified: '已核实',
  resolved: '已解决',
  closed: '已关闭',
};

export interface QuarantineRecord {
  id: string;
  deviation_id?: string;
  batch_id: string;
  batch_no: string;
  vaccine_name: string;
  quantity: number;
  priority: number;
  reason: string;
  operator_id?: string;
  status: 'quarantined' | 'pending_review' | 'released' | 'recalled' | 'destroyed';
  created_at: string;
}

export const QuarantineStatusLabels: Record<string, string> = {
  quarantined: '已隔离',
  pending_review: '待复核',
  released: '已放行',
  recalled: '已召回',
  destroyed: '已销毁',
};

export interface ReviewRecord {
  id: string;
  quarantine_id: string;
  deviation_id?: string;
  reviewer_id?: string;
  review_opinion: string;
  review_result: 'release' | 'recall' | 'destroy' | 'pending';
  reviewed_at: string;
}

export const ReviewResultLabels: Record<string, string> = {
  release: '放行',
  recall: '召回',
  destroy: '销毁',
  pending: '待处理',
};

export interface RecallRecord {
  id: string;
  recall_no: string;
  batch_id: string;
  batch_no: string;
  vaccine_name: string;
  total_quantity: number;
  reason: string;
  initiator_id?: string;
  status: 'notified' | 'in_progress' | 'completed' | 'cancelled';
  vaccination_sites?: string;
  notified_at: string;
  completed_at?: string;
  created_at: string;
}

export const RecallStatusLabels: Record<string, string> = {
  notified: '已通知',
  in_progress: '召回中',
  completed: '已完成',
  cancelled: '已取消',
};

export const RecallStatusColors: Record<string, string> = {
  notified: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export interface VaccinationSite {
  id: string;
  name: string;
  code: string;
  address: string;
  manager_name?: string;
  manager_phone?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface SiteInventory {
  id: string;
  site_id: string;
  batch_id: string;
  batch_no: string;
  vaccine_name: string;
  expected_quantity: number;
  actual_quantity: number;
  status: 'normal' | 'mismatch' | 'reconciled';
  last_checked?: string;
  created_at: string;
}

export interface DashboardStats {
  active_cold_storages: number;
  active_transport_boxes: number;
  normal_batches: number;
  quarantined_batches: number;
  deviations: DeviationStats;
  recalls: RecallStats;
  inventory_mismatches: number;
}

export interface DeviationStats {
  total: number;
  detected: number;
  processing: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface RecallStats {
  total: number;
  notified: number;
  in_progress: number;
  completed: number;
}

export interface RiskLaneGroup {
  temp_zone: string;
  duration_range: string;
  items: TemperatureDeviation[];
}

export interface TraceReport {
  batch_id: string;
  batch_no: string;
  vaccine_name: string;
  temperature_history: TemperatureRecord[];
  deviation_count: number;
  quarantine_events: QuarantineRecord[];
  recall_events: RecallRecord[];
}

export interface CreateColdStorageRequest {
  name: string;
  code: string;
  location: string;
  capacity: number;
  min_temp: number;
  max_temp: number;
}

export interface UpdateColdStorageRequest {
  name: string;
  code: string;
  location: string;
  capacity: number;
  min_temp: number;
  max_temp: number;
  status: ColdStorage['status'];
}

export interface CreateTransportBoxRequest {
  name: string;
  code: string;
  model?: string;
  capacity: number;
  min_temp: number;
  max_temp: number;
  current_location?: string;
}

export interface UpdateTransportBoxRequest {
  name: string;
  code: string;
  model?: string;
  capacity: number;
  min_temp: number;
  max_temp: number;
  current_location?: string;
  status: TransportBox['status'];
}

export interface CreateReviewRequest {
  quarantine_id: string;
  deviation_id?: string;
  review_opinion: string;
  review_result: 'release' | 'recall' | 'destroy';
  reviewer_id?: string;
}
