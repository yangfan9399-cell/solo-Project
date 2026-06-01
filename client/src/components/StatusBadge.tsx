import { cn } from '../utils/cn';
import { statusColors, statusLabels, urgencyColors, urgencyLabels } from '../utils/format';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusColors[status] || 'bg-gray-100 text-gray-800',
        className
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}

interface UrgencyBadgeProps {
  urgency: string;
  className?: string;
}

export function UrgencyBadge({ urgency, className }: UrgencyBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        urgencyColors[urgency] || 'bg-gray-100 text-gray-800',
        className
      )}
    >
      {urgencyLabels[urgency] || urgency}
    </span>
  );
}
