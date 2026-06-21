import type { Status } from '@/types';

const statusConfig: Record<Status, { label: string; bg: string; text: string }> = {
  pass: { label: '通过', bg: 'rgba(82, 183, 136, 0.15)', text: 'var(--accent-green)' },
  warn: { label: '警告', bg: 'rgba(233, 196, 106, 0.15)', text: 'var(--accent-amber)' },
  block: { label: '阻断', bg: 'rgba(231, 111, 81, 0.15)', text: 'var(--accent-red)' },
};

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClass}`}
      style={{ background: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}
