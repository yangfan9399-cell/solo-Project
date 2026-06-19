export type WorkOrderStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'locked'
  | 'in_progress'
  | 'completed'
  | 'delayed'
  | 'rejected'
  | 'missing_parts';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type TowerSection =
  | 'foundation'
  | 'tower_lower'
  | 'tower_middle'
  | 'tower_upper'
  | 'nacelle'
  | 'hub'
  | 'blade_1'
  | 'blade_2'
  | 'blade_3';

export interface PartRequirement {
  partBatchId: string;
  partName: string;
  quantity: number;
}

export interface WorkOrder {
  id: string;
  code: string;
  turbineId: string;
  towerSection: TowerSection;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  parts: PartRequirement[];
  teamId: string;
  riskLevel: RiskLevel;
  riskDescription: string;
  safetyConfirmed: boolean;
  status: WorkOrderStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  lockedAt?: string;
  rejectionReason?: string;
}

export interface PartBatch {
  id: string;
  name: string;
  category: string;
  totalStock: number;
  unit: string;
}

export interface TechnicianTeam {
  id: string;
  name: string;
  members: string[];
  leader: string;
}

export type ApprovalAction =
  | 'submit'
  | 'approve'
  | 'reject'
  | 'lock'
  | 'unlock'
  | 'safety_confirm'
  | 'delay'
  | 'complete';

export interface ApprovalRecord {
  id: string;
  workOrderId: string;
  action: ApprovalAction;
  operator: string;
  operatorRole: string;
  timestamp: string;
  comment: string;
}

export type ConflictType =
  | 'part_overlap'
  | 'window_overlap'
  | 'safety_unconfirmed'
  | 'part_shortage';

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: 'warning' | 'critical';
  title: string;
  explanation: string;
  workOrderIds: string[];
  partBatchId?: string;
  detectedAt: string;
}

export type EntityType =
  | 'work_order'
  | 'part_batch'
  | 'approval'
  | 'conflict_recalc'
  | 'export';

export interface AuditLog {
  id: string;
  action: string;
  entityType: EntityType;
  entityId?: string;
  operator: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface Filters {
  status?: WorkOrderStatus[];
  turbineId?: string;
  teamId?: string;
  riskLevel?: RiskLevel[];
  dateRange?: [string, string];
}

export interface UIState {
  selectedDate: string;
  selectedWorkOrderId?: string;
  showWorkOrderModal: boolean;
  showExportModal: boolean;
  activeTab: 'calendar' | 'queue' | 'matrix';
  editingWorkOrderId?: string;
  matrixWeekOffset?: number;
  matrixSelectedPartId?: string | 'all';
  rightPanelTab?: 'approvals' | 'audit';
}

export interface AppState {
  workOrders: WorkOrder[];
  partBatches: PartBatch[];
  teams: TechnicianTeam[];
  conflicts: Conflict[];
  approvals: ApprovalRecord[];
  auditLogs: AuditLog[];
  filters: Filters;
  ui: UIState;
  currentUser: { name: string; role: string };
}

export const TOWER_SECTION_LABELS: Record<TowerSection, string> = {
  foundation: '基础基座',
  tower_lower: '塔筒下段',
  tower_middle: '塔筒中段',
  tower_upper: '塔筒上段',
  nacelle: '机舱',
  hub: '轮毂',
  blade_1: '叶片 1 号',
  blade_2: '叶片 2 号',
  blade_3: '叶片 3 号',
};

export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  draft: '草稿',
  pending: '待审批',
  approved: '已审批',
  locked: '已锁定',
  in_progress: '执行中',
  completed: '已完成',
  delayed: '已延期',
  rejected: '已驳回',
  missing_parts: '缺备件',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '极高风险',
};

export const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  draft: 'bg-deep-sea-600 border-deep-sea-400 text-deep-sea-100',
  pending: 'bg-warn-orange-700 border-warn-orange-500 text-white',
  approved: 'bg-deep-sea-500 border-deep-sea-300 text-white',
  locked: 'bg-industrial-copper-700 border-industrial-copper-500 text-industrial-copper-50',
  in_progress: 'bg-safety-green-700 border-safety-green-500 text-white',
  completed: 'bg-safety-green-600 border-safety-green-400 text-white',
  delayed: 'bg-warn-orange-600 border-warn-orange-400 text-white',
  rejected: 'bg-alert-red-700 border-alert-red-500 text-white',
  missing_parts: 'bg-alert-red-600 border-alert-red-400 text-white',
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: 'bg-safety-green-700 border-safety-green-500 text-safety-green-50',
  medium: 'bg-warn-orange-700 border-warn-orange-500 text-white',
  high: 'bg-alert-red-700 border-alert-red-500 text-white',
  critical: 'bg-alert-red-600 border-alert-red-400 text-white glow-red',
};

export const CONFLICT_TYPE_LABELS: Record<ConflictType, string> = {
  part_overlap: '备件占用冲突',
  window_overlap: '停机窗口冲突',
  safety_unconfirmed: '高风险未确认',
  part_shortage: '备件库存不足',
};
