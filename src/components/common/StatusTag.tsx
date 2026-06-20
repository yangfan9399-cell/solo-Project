import React from 'react';
import { ReleaseStatus } from '../../shared/types';
import { statusTextMap, statusColorMap } from '../../utils/format';
import { cn } from '../../lib/utils';

interface StatusTagProps {
  status: ReleaseStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusTag: React.FC<StatusTagProps> = ({
  status,
  size = 'md',
  className,
}) => {
  const colors = statusColorMap[status];
  const text = statusTextMap[status];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded border',
        sizeClasses[size],
        colors.text,
        colors.bg,
        colors.border,
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          status === ReleaseStatus.published && 'bg-bronze-500',
          status === ReleaseStatus.pending && 'bg-stoneBlue-500',
          status === ReleaseStatus.blocked && 'bg-cinnabar-500',
          (status === ReleaseStatus.draft || status === ReleaseStatus.rolled_back) && 'bg-ink-400'
        )}
      />
      {text}
    </span>
  );
};

export default StatusTag;
