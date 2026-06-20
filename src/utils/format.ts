import { ReleaseStatus, PackageDimension } from '../shared/types';

export const formatDate = (date: string | Date, format: 'full' | 'date' | 'time' = 'full'): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  switch (format) {
    case 'date':
      return `${year}年${month}月${day}日`;
    case 'time':
      return `${hours}:${minutes}:${seconds}`;
    default:
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  }
};

export const formatRelativeTime = (date: string | Date): string => {
  const d = new Date(date).getTime();
  const now = Date.now();
  const diff = now - d;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  if (diff < week) return `${Math.floor(diff / day)}天前`;
  if (diff < month) return `${Math.floor(diff / week)}周前`;
  if (diff < year) return `${Math.floor(diff / month)}个月前`;
  return `${Math.floor(diff / year)}年前`;
};

export const statusTextMap: Record<ReleaseStatus, string> = {
  [ReleaseStatus.draft]: '草稿',
  [ReleaseStatus.pending]: '待发布',
  [ReleaseStatus.blocked]: '有阻断',
  [ReleaseStatus.published]: '已发布',
  [ReleaseStatus.rolled_back]: '已回滚',
};

export const dimensionTextMap: Record<PackageDimension, string> = {
  [PackageDimension.clarity]: '拓片清晰度',
  [PackageDimension.rust_level]: '锈蚀级别',
  [PackageDimension.inscription]: '铭文残缺',
  [PackageDimension.orientation]: '井圈方位',
};

export const statusColorMap: Record<ReleaseStatus, { text: string; bg: string; border: string }> = {
  [ReleaseStatus.draft]: { text: 'text-ink-400', bg: 'bg-ink-100', border: 'border-ink-300' },
  [ReleaseStatus.pending]: { text: 'text-stoneBlue-600', bg: 'bg-stoneBlue-50', border: 'border-stoneBlue-300' },
  [ReleaseStatus.blocked]: { text: 'text-cinnabar-600', bg: 'bg-cinnabar-50', border: 'border-cinnabar-300' },
  [ReleaseStatus.published]: { text: 'text-bronze-600', bg: 'bg-bronze-50', border: 'border-bronze-300' },
  [ReleaseStatus.rolled_back]: { text: 'text-ink-400', bg: 'bg-ink-100', border: 'border-ink-300' },
};

export const sealColorMap: Record<ReleaseStatus, string> = {
  [ReleaseStatus.draft]: '#8C8C8C',
  [ReleaseStatus.pending]: '#2C5F8C',
  [ReleaseStatus.blocked]: '#C23B22',
  [ReleaseStatus.published]: '#3A6347',
  [ReleaseStatus.rolled_back]: '#8C8C8C',
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + '千';
  }
  return String(num);
};
