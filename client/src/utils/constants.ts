import type { EquipmentStatus, TaskStatus, ReservationStatus, MediaCardStatus, MediaCardRecordAction, MediaCardReturnStatus, DamageType, DamageStatus, ReminderType, ReminderStatus, UserRole } from '../types';

export const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  in_use: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  damaged: 'bg-red-100 text-red-800',
  scrapped: 'bg-gray-100 text-gray-800',
  lost: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  picked_up: 'bg-blue-100 text-blue-800',
  returned: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  minor: 'bg-yellow-100 text-yellow-800',
  moderate: 'bg-orange-100 text-orange-800',
  severe: 'bg-red-100 text-red-800',
  repairing: 'bg-blue-100 text-blue-800',
  repaired: 'bg-green-100 text-green-800',
  notified: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
};

export const STATUS_LABELS: Record<string, string> = {
  available: '可用',
  in_use: '使用中',
  maintenance: '维修中',
  damaged: '已损坏',
  scrapped: '已报废',
  lost: '已丢失',
  draft: '草稿',
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  picked_up: '已领用',
  returned: '已归还',
  overdue: '已逾期',
  minor: '轻微',
  moderate: '中等',
  severe: '严重',
  repairing: '维修中',
  repaired: '已修复',
  notified: '已通知',
  resolved: '已解决',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  reporter: '记者',
  admin: '设备管理员',
  producer: '制片负责人',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  reporter: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  producer: 'bg-orange-100 text-orange-800',
};

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'reporter', label: '记者' },
  { value: 'admin', label: '设备管理员' },
  { value: 'producer', label: '制片负责人' },
];

export const USER_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
};

export const USER_STATUS_LABELS: Record<string, string> = {
  active: '正常',
  inactive: '已禁用',
};

export const EQUIPMENT_CATEGORIES = [
  { value: '摄像机', label: '摄像机' },
  { value: '相机', label: '相机' },
  { value: '无人机', label: '无人机' },
  { value: '稳定器', label: '稳定器' },
  { value: '麦克风', label: '麦克风' },
  { value: '灯光设备', label: '灯光设备' },
  { value: '脚架', label: '脚架' },
  { value: '其他', label: '其他' },
];

export const MEDIA_CARD_TYPES = [
  { value: 'SD卡', label: 'SD卡' },
  { value: 'CFexpress卡', label: 'CFexpress卡' },
  { value: 'XQD卡', label: 'XQD卡' },
  { value: 'TF卡', label: 'TF卡' },
  { value: 'SSD', label: '移动SSD' },
];

export const EQUIPMENT_STATUS_OPTIONS: { value: EquipmentStatus; label: string }[] = [
  { value: 'available', label: '可用' },
  { value: 'in_use', label: '使用中' },
  { value: 'maintenance', label: '维修中' },
  { value: 'damaged', label: '已损坏' },
  { value: 'scrapped', label: '已报废' },
];

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'draft', label: '草稿' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export const RESERVATION_STATUS_OPTIONS: { value: ReservationStatus; label: string }[] = [
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'picked_up', label: '已领用' },
  { value: 'returned', label: '已归还' },
  { value: 'overdue', label: '已逾期' },
  { value: 'cancelled', label: '已取消' },
];

export const MEDIA_CARD_STATUS_OPTIONS: { value: MediaCardStatus; label: string }[] = [
  { value: 'available', label: '可用' },
  { value: 'in_use', label: '使用中' },
  { value: 'damaged', label: '已损坏' },
  { value: 'lost', label: '已丢失' },
];

export const DAMAGE_TYPE_OPTIONS: { value: DamageType; label: string }[] = [
  { value: 'minor', label: '轻微损坏' },
  { value: 'moderate', label: '中等损坏' },
  { value: 'severe', label: '严重损坏' },
];

export const DAMAGE_STATUS_OPTIONS: { value: DamageStatus; label: string }[] = [
  { value: 'pending', label: '待处理' },
  { value: 'repairing', label: '维修中' },
  { value: 'repaired', label: '已修复' },
  { value: 'scrapped', label: '已报废' },
];

export const REMINDER_STATUS_OPTIONS: { value: ReminderStatus; label: string }[] = [
  { value: 'pending', label: '待通知' },
  { value: 'notified', label: '已通知' },
  { value: 'resolved', label: '已解决' },
];

export const REMINDER_TYPE_OPTIONS: { value: ReminderType; label: string }[] = [
  { value: 'reservation', label: '设备逾期' },
  { value: 'media_card', label: '素材卡逾期' },
];

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  reservation: '设备逾期',
  media_card: '素材卡逾期',
};

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
];

export const MEDIA_CARD_RECORD_COLORS: Record<MediaCardRecordAction, string> = {
  borrow: 'bg-blue-100 text-blue-800 border-blue-200',
  return: 'bg-green-100 text-green-800 border-green-200',
  damage_return: 'bg-orange-100 text-orange-800 border-orange-200',
  loss: 'bg-red-100 text-red-800 border-red-200',
  repair: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  scrap: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const MEDIA_CARD_RECORD_LABELS: Record<MediaCardRecordAction, string> = {
  borrow: '借出',
  return: '归还',
  damage_return: '损坏归还',
  loss: '丢失',
  repair: '维修',
  scrap: '报废',
};

export const MEDIA_CARD_RETURN_STATUS_LABELS: Record<MediaCardReturnStatus, string> = {
  normal: '正常',
  damaged: '损坏',
  lost: '丢失',
};
