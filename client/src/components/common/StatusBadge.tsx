import React from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  const label = STATUS_LABELS[status] || status;

  return (
    <span className={`badge ${colorClass} ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
