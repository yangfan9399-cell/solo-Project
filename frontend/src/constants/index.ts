import { createContextId } from '@builder.io/qwik';
import type { User } from '~/types';

export interface AppState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

export const AppStore = createContextId<AppState>('app-store');

export const API_BASE_URL = typeof window !== 'undefined' 
  ? '/api' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api');

export const ROLE_LABELS: Record<string, string> = {
  restorer: '修复师',
  librarian: '馆藏管理员',
  expert: '外聘专家',
};

export const BOOK_STATUS_LABELS: Record<string, string> = {
  pending: '待诊断',
  diagnosing: '诊断中',
  scheduled: '已排程',
  repairing: '修复中',
  reviewing: '复核中',
  completed: '已完成',
  archived: '已归档',
};

export const DISEASE_TYPE_LABELS: Record<string, string> = {
  acidification: '酸化',
  moth_damage: '虫蛀',
  mold: '霉斑',
  tear: '撕裂',
  stain: '污渍',
  brittleness: '脆化',
  other: '其他',
};

export const DISEASE_SEVERITY_LABELS: Record<string, string> = {
  mild: '轻度',
  moderate: '中度',
  severe: '重度',
  critical: '危重度',
};

export const PROCESS_STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  skipped: '已跳过',
};

export const REVIEW_TYPE_LABELS: Record<string, string> = {
  disease_diagnosis: '病害诊断复核',
  repair_process: '修复过程复核',
  final_archive: '最终归档复核',
};

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  pending: '待复核',
  approved: '已通过',
  rejected: '已拒绝',
  need_revision: '需修改',
};

export const MATERIAL_CATEGORY_LABELS: Record<string, string> = {
  paper: '纸张',
  adhesive: '胶粘剂',
  tool: '工具',
  chemical: '化学品',
  other: '其他',
};

export const ARCHIVE_TYPE_LABELS: Record<string, string> = {
  image: '影像资料',
  document: '文档',
  record: '修复记录',
  other: '其他',
};
