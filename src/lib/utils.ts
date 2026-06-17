export function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    review: '审批中',
    approved: '已通过',
    rejected: '已驳回',
  };
  return map[status] || status;
}

export function alertLabel(level: string): string {
  const map: Record<string, string> = {
    normal: '正常',
    warning: '警告',
    danger: '危险',
  };
  return map[level] || level;
}

export function liftPointTypeLabel(t: string): string {
  const map: Record<string, string> = {
    fixed: '固定吊点',
    mobile: '移动吊点',
    rotation: '旋转吊点',
    swing: '摆动吊点',
  };
  return map[t] || t;
}

export function motionTypeLabel(t: string): string {
  const map: Record<string, string> = {
    linear: '直线运动',
    arc: '弧线运动',
    swing: '摆动',
    complex: '复合运动',
  };
  return map[t] || t;
}

export const alertLevelClasses: Record<string, string> = {
  normal: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-300',
  danger: 'bg-red-100 text-red-800 border-red-400 animate-pulse',
};

export const statusClasses: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-300',
  review: 'bg-blue-100 text-blue-800 border-blue-300',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rejected: 'bg-rose-100 text-rose-800 border-rose-300',
};

export function cn(...args: Array<string | undefined | false | null>): string {
  return args.filter(Boolean).join(' ');
}

export function genId(): string {
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}
