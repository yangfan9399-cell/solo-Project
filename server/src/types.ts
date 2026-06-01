export type UserRole = 'chemist' | 'repair_crew' | 'hotline' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  department: string;
  avatar?: string;
  created_at: string;
}

export type WaterQualityStatus = 'normal' | 'abnormal' | 'processing' | 'rechecking' | 'resolved';

export interface WaterQualityTest {
  id: string;
  test_date: string;
  location_id: string;
  location_name: string;
  ph: number;
  turbidity: number;
  residual_chlorine: number;
  coliform: number;
  status: WaterQualityStatus;
  tested_by: string;
  tester_name: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export type RepairReportType = 'water_quality' | 'pipe_leak' | 'pressure_low' | 'no_water' | 'meter_issue' | 'other';
export type RepairStatus = 'pending' | 'assessing' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RepairReport {
  id: string;
  report_no: string;
  type: RepairReportType;
  title: string;
  description: string;
  location: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  affected_area?: string;
  affected_population?: number;
  urgency: UrgencyLevel;
  status: RepairStatus;
  reported_by?: string;
  reporter_name?: string;
  reporter_role?: string;
  assigned_to?: string;
  assignee_name?: string;
  water_stop_needed: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkOrder {
  id: string;
  order_no: string;
  repair_report_id: string;
  title: string;
  description: string;
  location: string;
  team_id: string;
  team_name: string;
  team_members: string;
  priority: UrgencyLevel;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  estimated_start?: string;
  estimated_end?: string;
  actual_start?: string;
  actual_end?: string;
  materials_used?: string;
  work_summary?: string;
  created_at: string;
  updated_at: string;
}

export interface WaterStopNotice {
  id: string;
  notice_no: string;
  title: string;
  content: string;
  affected_area: string;
  affected_population?: number;
  start_time: string;
  end_time: string;
  reason: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  published: boolean;
  published_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RecheckRecord {
  id: string;
  water_quality_test_id: string;
  recheck_date: string;
  ph: number;
  turbidity: number;
  residual_chlorine: number;
  coliform: number;
  result: 'pass' | 'fail';
  rechecked_by: string;
  rechecker_name: string;
  remark?: string;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  type: 'water_plant' | 'pipe_network' | 'community' | 'factory';
  address: string;
  area: string;
  population?: number;
  created_at: string;
}

export interface RepairTeam {
  id: string;
  name: string;
  leader: string;
  leader_phone: string;
  members: string;
  area: string;
  status: 'available' | 'busy' | 'offline';
  created_at: string;
}

export interface Notification {
  id: string;
  type: 'repair' | 'quality' | 'water_stop' | 'system';
  title: string;
  content: string;
  target_roles: string;
  is_read: number;
  created_at: string;
}
