import React from 'react';
import { ReleaseStatus } from '../../shared/types';
import { statusTextMap, sealColorMap } from '../../utils/format';
import { cn } from '../../lib/utils';

interface SealBadgeProps {
  status: ReleaseStatus;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const SealBadge: React.FC<SealBadgeProps> = ({
  status,
  size = 'md',
  animated = false,
  className,
}) => {
  const color = sealColorMap[status];
  const text = statusTextMap[status];

  const sizeClasses = {
    sm: 'w-12 h-12 text-[10px]',
    md: 'w-16 h-16 text-xs',
    lg: 'w-20 h-20 text-sm',
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full font-song font-bold',
        'border-2',
        sizeClasses[size],
        animated && 'animate-seal-stamp',
        className
      )}
      style={{
        color,
        borderColor: color,
        transform: 'rotate(-3deg)',
        boxShadow: `0 2px 8px ${color}33, 0 4px 16px ${color}22`,
      }}
    >
      <div
        className="absolute inset-1 rounded-full opacity-10"
        style={{ backgroundColor: color }}
      />
      <span className="relative z-10 text-center leading-tight">
        {text.split('').map((char, i) => (
          <span key={i} className="block">
            {char}
          </span>
        ))}
      </span>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}22 0%, transparent 50%)`,
        }}
      />
    </div>
  );
};

export default SealBadge;
