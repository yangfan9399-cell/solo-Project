export interface TraySlot {
  id: number;
  tray_id: string;
  row: number;
  col: number;
  character: string | null;
  status: 'normal' | 'missing' | 'worn' | 'reserved';
  wear_level: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CarvePlan {
  id: number;
  batch_no: string;
  character: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  task_id: number | null;
  estimated_date: string | null;
  completed_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrintTask {
  id: number;
  task_no: string;
  title: string;
  client: string;
  required_chars: string[];
  status: 'draft' | 'confirmed' | 'in_production' | 'completed' | 'cancelled';
  priority: 'normal' | 'high' | 'urgent';
  deadline: string;
  created_at: string;
  updated_at: string;
}

export interface TrayHistory {
  id: number;
  tray_id: string;
  slot_id: number;
  character: string | null;
  old_status: string;
  new_status: string;
  action_type: string;
  operator: string;
  timestamp: string;
  batch_no: string | null;
  task_id: number | null;
  notes: string | null;
}

export interface CarveBatch {
  id: number;
  batch_no: string;
  total_chars: number;
  completed_chars: number;
  status: 'draft' | 'approved' | 'in_production' | 'completed' | 'rolled_back';
  version: number;
  parent_batch: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: number;
  type: 'missing' | 'worn' | 'deadline' | 'shortage';
  severity: 'info' | 'warning' | 'danger';
  message: string;
  character: string | null;
  task_id: number | null;
  batch_no: string | null;
  is_read: number;
  created_at: string;
}

export type SlotStatus = TraySlot['status'];
export type CarvePlanStatus = CarvePlan['status'];
export type TaskStatus = PrintTask['status'];
export type BatchStatus = CarveBatch['status'];
