export type UserRole = 'reporter' | 'admin' | 'producer';

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone: string;
  status: 'active' | 'inactive';
  created_at: string;
}

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
  status: 'available' | 'in_use' | 'maintenance' | 'damaged' | 'scrapped';
  location: string;
  specification: string;
  description: string;
  accessories: string;
  remark: string;
  created_at: string;
}

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
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  producer_id: number | null;
  producer_name: string | null;
  approved_at: string | null;
  completed_at: string | null;
  remark: string;
  created_at: string;
}

export interface Reservation {
  id: number;
  reservation_no: string;
  task_id: number | null;
  equipment_id: number;
  equipment_name: string;
  requester_id: number;
  requester_name: string;
  expected_pickup_time: string;
  expected_return_time: string;
  actual_pickup_time: string | null;
  actual_return_time: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'picked_up' | 'returned' | 'overdue' | 'cancelled';
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
}

export interface MediaCard {
  id: number;
  code: string;
  type: string;
  capacity: string;
  brand: string;
  equipment_id: number | null;
  equipment_name: string | null;
  status: 'available' | 'in_use' | 'damaged' | 'lost';
  current_user_id: number | null;
  current_user_name: string | null;
  borrow_time: string | null;
  expected_return_time: string | null;
  description: string;
  remark: string;
  created_at: string;
}

export interface DamageReport {
  id: number;
  report_no: string;
  equipment_id: number;
  equipment_name: string;
  reporter_id: number;
  reporter_name: string;
  damage_type: 'minor' | 'moderate' | 'severe';
  description: string;
  occurred_time: string;
  location: string;
  status: 'pending' | 'repairing' | 'repaired' | 'scrapped';
  handler_id: number | null;
  handler_name: string | null;
  repair_cost: number | null;
  repair_result: string | null;
  resolved_at: string | null;
  remark: string;
  created_at: string;
}

export interface OverdueReminder {
  id: number;
  type: 'reservation' | 'media_card';
  related_id: number;
  related_no: string;
  equipment_name: string;
  user_id: number;
  user_name: string;
  due_time: string;
  overdue_days: number;
  status: 'pending' | 'notified' | 'resolved';
  notified_at: string | null;
  resolved_at: string | null;
  remark: string;
  created_at: string;
}

export type MediaCardRecordAction = 'borrow' | 'return' | 'damage_return' | 'loss' | 'repair' | 'scrap';
export type MediaCardReturnStatus = 'normal' | 'damaged' | 'lost';

export interface MediaCardRecord {
  id: number;
  media_card_id: number;
  media_card_code: string;
  action_type: MediaCardRecordAction;
  user_id: number;
  user_name: string;
  handler_id: number | null;
  handler_name: string | null;
  reservation_id: number | null;
  reservation_no: string | null;
  borrow_time: string | null;
  expected_return_time: string | null;
  actual_return_time: string | null;
  return_status: MediaCardReturnStatus | null;
  damage_report_id: number | null;
  remark: string | null;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
