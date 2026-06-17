import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AnomalyLevel, ProjectStatus } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(str: string): string {
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return str;
  }
}

export function formatDate(str: string): string {
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return str;
  }
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: '草稿',
  in_progress: '修版中',
  review: '待审核',
  completed: '已归档',
};

export const STATUS_CLASS: Record<ProjectStatus, string> = {
  draft: 'bg-stone-100 text-stone-700 ring-1 ring-stone-300',
  in_progress: 'bg-amber-50 text-amber-800 ring-1 ring-amber-300',
  review: 'bg-sky-50 text-sky-800 ring-1 ring-sky-300',
  completed: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300',
};

export const ANOMALY_LABEL: Record<AnomalyLevel, string> = {
  none: '正常',
  minor: '轻微',
  moderate: '中等',
  severe: '严重',
};

export const ANOMALY_CLASS: Record<AnomalyLevel, string> = {
  none: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  minor: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  moderate: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  severe: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

export const ANOMALY_DOT: Record<AnomalyLevel, string> = {
  none: 'bg-emerald-500',
  minor: 'bg-amber-500',
  moderate: 'bg-orange-500',
  severe: 'bg-rose-500',
};

export const ACTION_LABEL: Record<string, string> = {
  align: '对位调整',
  retrim: '修版',
  reprint: '重印',
  note: '备注',
  block_repair: '版材修复',
};

export const ACTION_CLASS: Record<string, string> = {
  align: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  retrim: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  reprint: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  note: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200',
  block_repair: 'bg-cinnabar/10 text-cinnabar ring-1 ring-cinnabar/30',
};

export function pxToMm(px: number, dpi = 600): number {
  return Math.round((px / dpi) * 25.4 * 100) / 100;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
