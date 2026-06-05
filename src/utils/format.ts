import dayjs from 'dayjs';
import { BookingStatus, ConflictType, Role } from '../types';

export const formatDateTime = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatDate = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatTime = (date: Date | string): string => {
  return dayjs(date).format('HH:mm');
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const getStatusText = (status: BookingStatus): string => {
  const statusMap: Record<BookingStatus, string> = {
    [BookingStatus.PENDING]: '待确认',
    [BookingStatus.CONFIRMED]: '已确认',
    [BookingStatus.REJECTED]: '已拒绝',
    [BookingStatus.CANCELLED]: '已取消',
    [BookingStatus.ARCHIVED]: '已归档',
    [BookingStatus.CONFLICT]: '有冲突',
  };
  return statusMap[status];
};

export const getStatusColor = (status: BookingStatus): string => {
  const colorMap: Record<BookingStatus, string> = {
    [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [BookingStatus.CONFIRMED]: 'bg-green-100 text-green-800',
    [BookingStatus.REJECTED]: 'bg-red-100 text-red-800',
    [BookingStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
    [BookingStatus.ARCHIVED]: 'bg-blue-100 text-blue-800',
    [BookingStatus.CONFLICT]: 'bg-red-100 text-red-800',
  };
  return colorMap[status];
};

export const getConflictTypeText = (type: ConflictType): string => {
  const typeMap: Record<ConflictType, string> = {
    [ConflictType.NONE]: '无冲突',
    [ConflictType.TIME_OVERLAP]: '时间重叠',
    [ConflictType.EQUIPMENT_MISSING]: '设备缺失',
    [ConflictType.COST_ALLOCATION_MISMATCH]: '分摊不匹配',
  };
  return typeMap[type];
};

export const getConflictTypeColor = (type: ConflictType): string => {
  const colorMap: Record<ConflictType, string> = {
    [ConflictType.NONE]: 'bg-green-100 text-green-800',
    [ConflictType.TIME_OVERLAP]: 'bg-red-100 text-red-800',
    [ConflictType.EQUIPMENT_MISSING]: 'bg-orange-100 text-orange-800',
    [ConflictType.COST_ALLOCATION_MISMATCH]: 'bg-purple-100 text-purple-800',
  };
  return colorMap[type];
};

export const getRoleText = (role: Role): string => {
  const roleMap: Record<Role, string> = {
    [Role.ADMIN]: '行政经办人',
    [Role.DEPARTMENT_HEAD]: '部门负责人',
    [Role.REVIEWER]: '复核人',
  };
  return roleMap[role];
};

export const getDuration = (startTime: Date, endTime: Date): number => {
  return (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);
};
