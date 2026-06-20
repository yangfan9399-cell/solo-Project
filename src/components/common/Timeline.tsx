import React from 'react';
import { cn } from '../../lib/utils';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  status?: 'completed' | 'current' | 'pending' | 'failed';
  icon?: React.ReactNode;
  extra?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  size?: 'sm' | 'md';
}

export const Timeline: React.FC<TimelineProps> = ({
  items,
  className,
  size = 'md',
}) => {
  const getDotColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-bronze-500 border-bronze-600';
      case 'current':
        return 'bg-ochre-500 border-ochre-600 animate-pulse-glow';
      case 'failed':
        return 'bg-cinnabar-500 border-cinnabar-600';
      case 'pending':
      default:
        return 'bg-paper-100 border-ochre-300';
    }
  };

  const getLineColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-bronze-300';
      case 'current':
      case 'pending':
      default:
        return 'bg-ochre-200';
    }
  };

  const sizeClasses = {
    sm: 'pl-6 gap-3',
    md: 'pl-8 gap-4',
  };

  const dotSizeClasses = {
    sm: 'w-3 h-3 -left-[22px]',
    md: 'w-4 h-4 -left-[30px]',
  };

  return (
    <div className={cn('relative', className)}>
      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn('relative pb-6 last:pb-0', sizeClasses[size])}
        >
          {index < items.length - 1 && (
            <div
              className={cn(
                'absolute top-4 bottom-0 w-0.5',
                size === 'sm' ? 'left-[18px]' : 'left-[25px]',
                getLineColor(item.status)
              )}
            />
          )}

          <div
            className={cn(
              'absolute top-1 rounded-full border-2 z-10',
              dotSizeClasses[size],
              getDotColor(item.status)
            )}
          >
            {item.icon && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-[8px]">
                {item.icon}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h4
                className={cn(
                  'font-song font-medium text-ochre-800',
                  size === 'sm' ? 'text-sm' : 'text-base'
                )}
              >
                {item.title}
              </h4>
              {item.timestamp && (
                <span className="text-xs text-ochre-500 font-heiti">
                  {item.timestamp}
                </span>
              )}
            </div>
            {item.description && (
              <p className={cn(
                'text-ochre-600 mt-1',
                size === 'sm' ? 'text-xs' : 'text-sm'
              )}>
                {item.description}
              </p>
            )}
            {item.extra && (
              <div className="mt-2">{item.extra}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
