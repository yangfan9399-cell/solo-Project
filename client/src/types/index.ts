export type UserRole = 'reporter' | 'admin' | 'producer';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'damaged' | 'scrapped';

export interface Equipment {
  id: number;
  name: string;
  code: string;
  category: string;
  brand: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  purchase_price: number;
  stock_quantity: number;
  available_quantity?: number;
  status: EquipmentStatus;
  location: string;
  specification: string;
  description: string;
  accessories: string;
  remark: string;
  created_at: string;
  recent_reservations?: Reservation[];
  damage_reports?: DamageReport[];
}

export type TaskStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface ShootingTask {
  id: number;
  task_no: string;
  title: string;
  description: string;
  reporter_id: number;
  reporter_name: string;
  shooting_location: string;
  shooting_start_time: string;
  shooting_end_time: string;
  priority: Priority;
  status: TaskStatus;
  producer_id: number | null;
  producer_name: string | null;
  approved_at: string | null;
  completed_at: string | null;
  remark: string;
  created_at: string;
  reservations?: Reservation[];
}

export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'picked_up' | 'returned' | 'overdue' | 'cancelled';

export interface Reservation {
  id: number;
  reservation_no: string;
  task_id: number | null;
  equipment_id: number;
  equipment_name: string;
  equipment_code?: string;
  equipment_category?: string;
  requester_id: number;
  requester_name: string;
  expected_pickup_time: string;
  expected_return_time: string;
  actual_pickup_time: string | null;
  actual_return_time: string | null;
  status: ReservationStatus;
  approver_id: number | null;
  approver_name: string | null;
  approved_at: string | null;
  pickup_handler_id: number | null;
  pickup_handler_name: string | null;
  return_handler_id: number | null;
  return_handler_name: string | null;
  purpose: string;
  remark: string;
  created_at: string;
  task_title?: string;
  task_number?: string;
}

export type MediaCardStatus = 'available' | 'in_use' | 'damaged' | 'lost';

export interface MediaCard {
  id: number;
  code: string;
  type: string;
  capacity: string;
  brand: string;
  equipment_id: number | null;
  equipment_name: string | null;
  status: MediaCardStatus;
  current_user_id: number | null;
  current_user_name: string | null;
  borrow_time: string | null;
  expected_return_time: string | null;
  description: string;
  remark: string;
  created_at: string;
}

export type DamageType = 'minor' | 'moderate' | 'severe';
export type DamageStatus = 'pending' | 'repairing' | 'repaired' | 'scrapped';

export interface DamageReport {
  id: number;
  report_no: string;
  equipment_id: number;
  equipment_name: string;
  equipment_code?: string;
  equipment_category?: string;
  equipment_brand?: string;
  equipment_model?: string;
  reporter_id: number;
  reporter_name: string;
  damage_type: DamageType;
  description: string;
  occurred_time: string;
  location: string;
  status: DamageStatus;
  handler_id: number | null;
  handler_name: string | null;
  repair_cost: number | null;
  repair_result: string | null;
  resolved_at: string | null;
  remark: string;
  created_at: string;
}

export type ReminderType = 'reservation' | 'media_card';
export type ReminderStatus = 'pending' | 'notified' | 'resolved';

export interface OverdueReminder {
  id: number;
  type: ReminderType;
  related_id: number;
  related_no: string;
  equipment_name: string;
  user_id: number;
  user_name: string;
  due_time: string;
  overdue_days: number;
  status: ReminderStatus;
  notified_at: string | null;
  resolved_at: string | null;
  remark: string;
  created_at: string;
}

export interface ScheduleItem {
  id: number;
  reservation_no: string;
  equipment_id: number;
  equipment_name: string;
  equipment_code: string;
  category: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  requester_name: string;
  purpose: string;
  task_title?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DashboardStats {
  equipment: {
    total: number;
    available: number;
    in_use: number;
    maintenance: number;
    damaged: number;
    scrapped: number;
  };
  tasks: {
    total: number;
    draft: number;
    pending: number;
    approved: number;
    rejected: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  reservations: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    picked_up: number;
    returned: number;
    overdue: number;
    cancelled: number;
  };
  media_cards: {
    total: number;
    available: number;
    in_use: number;
    damaged: number;
    lost: number;
  };
  overdue: {
    total: number;
    pending: number;
  };
  damage_reports: {
    total: number;
    pending: number;
    repairing: number;
    repaired: number;
    scrapped: number;
  };
  categories: { category: string; count: number }[];
  recent_tasks: ShootingTask[];
  pending_approvals: Reservation[];
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface ListResponse<T> {
  items: T;
  total: number;
  page: number;
  page_size: number;
}
