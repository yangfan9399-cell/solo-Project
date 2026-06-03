import dayjs from 'dayjs';

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return dayjs(date).format('HH:mm');
}

export function formatDateTimeRange(start: string | Date, end: string | Date): string {
  return `${formatDateTime(start)} ~ ${formatDateTime(end)}`;
}

export function formatRelativeTime(date: string | Date): string {
  const now = dayjs();
  const target = dayjs(date);
  const diff = now.diff(target, 'minute');

  if (diff < 1) return '刚刚';
  if (diff < 60) return `${diff}分钟前`;
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`;
  if (diff < 43200) return `${Math.floor(diff / 1440)}天前`;
  return formatDate(date);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
  const days = Math.floor(hours / 24);
  const hrs = hours % 24;
  return `${days}天${hrs > 0 ? hrs + '小时' : ''}`;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPhone(phone: string): string {
  if (!phone) return '-';
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
