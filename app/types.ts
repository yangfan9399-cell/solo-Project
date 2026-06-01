export interface Exhibit {
  id: number;
  name: string;
  code: string;
  category: string;
  era: string | null;
  material: string | null;
  dimensions: string | null;
  weight: string | null;
  description: string | null;
  condition: string | null;
  storage_location: string | null;
  value: string | null;
  insurance_info: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string | null;
  department: string | null;
  created_at: string;
}

export interface LoanApplication {
  id: number;
  exhibit_id: number;
  exhibit_name: string;
  applicant_id: number;
  applicant_name: string;
  borrowing_institution: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  exhibition_name: string;
  exhibition_location: string;
  purpose: string | null;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  current_stage: 'application' | 'review' | 'transport' | 'exhibition' | 'return' | 'completed';
  priority: 'low' | 'normal' | 'high';
  created_at: string;
  updated_at: string;
}

export interface ConservationReview {
  id: number;
  loan_id: number;
  reviewer_id: number;
  reviewer_name: string;
  temperature_requirement: string | null;
  humidity_requirement: string | null;
  light_requirement: string | null;
  packaging_requirement: string | null;
  special_requirements: string | null;
  condition_assessment: string | null;
  risks: string | null;
  recommendations: string | null;
  approved: boolean;
  review_date: string | null;
  remarks: string | null;
  created_at: string;
}

export interface TransportRecord {
  id: number;
  loan_id: number;
  transport_type: string;
  carrier: string | null;
  vehicle_number: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  departure_location: string | null;
  destination: string | null;
  scheduled_departure: string | null;
  scheduled_arrival: string | null;
  actual_departure: string | null;
  actual_arrival: string | null;
  escort_name: string | null;
  escort_phone: string | null;
  security_measures: string | null;
  status: 'scheduled' | 'in_transit' | 'completed' | 'delayed';
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface InspectionRecord {
  id: number;
  loan_id: number;
  inspector_id: number;
  inspector_name: string;
  inspection_date: string;
  temperature: string | null;
  humidity: string | null;
  condition_status: string | null;
  display_check: string | null;
  security_check: string | null;
  environment_check: string | null;
  findings: string | null;
  recommendations: string | null;
  photos: string | null;
  created_at: string;
}

export interface ReturnRecord {
  id: number;
  loan_id: number;
  handler_id: number;
  handler_name: string;
  return_date: string;
  return_location: string;
  receiver_name: string;
  receiver_phone: string;
  package_condition: string | null;
  overall_condition: string | null;
  items_checked: string | null;
  discrepancies: string | null;
  signatures: string | null;
  photos: string | null;
  remarks: string | null;
  created_at: string;
}

export interface DamageRecord {
  id: number;
  exhibit_id: number;
  loan_id: number | null;
  reporter_id: number;
  reporter_name: string;
  discovery_date: string;
  damage_location: string | null;
  damage_type: string | null;
  damage_severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  cause: string | null;
  immediate_actions: string | null;
  photos: string | null;
  status: 'reported' | 'investigating' | 'repairing' | 'resolved';
  repair_plan: string | null;
  estimated_cost: string | null;
  repair_status: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface StageTransition {
  id: number;
  loan_id: number;
  from_stage: string;
  to_stage: string;
  operator_id: number;
  operator_name: string;
  remarks: string | null;
  created_at: string;
}

export interface Exception {
  id: number;
  loan_id: number | null;
  exhibit_id: number | null;
  reporter_id: number;
  reporter_name: string;
  type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to_id: number | null;
  assigned_to_name: string | null;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

export const STAGES = [
  { key: 'application', label: '申请提交', icon: '📝' },
  { key: 'review', label: '文保审核', icon: '🔍' },
  { key: 'transport', label: '运输交接', icon: '🚚' },
  { key: 'exhibition', label: '展期巡检', icon: '🖼️' },
  { key: 'return', label: '归还点交', icon: '📦' },
  { key: 'completed', label: '完成归档', icon: '✅' },
] as const;

export const EXHIBIT_CATEGORIES = ['青铜器', '瓷器', '书画', '玉器', '陶器', '金银器', '木器', '其他'];

export const DAMAGE_TYPES = ['划痕', '碎裂', '变形', '褪色', '污渍', '霉变', '虫蛀', '其他'];

export const EXCEPTION_TYPES = [
  { key: 'transport', label: '运输异常', color: 'orange' },
  { key: 'exhibition', label: '展陈异常', color: 'blue' },
  { key: 'conservation', label: '文保异常', color: 'red' },
  { key: 'security', label: '安保异常', color: 'purple' },
  { key: 'other', label: '其他', color: 'gray' },
];
