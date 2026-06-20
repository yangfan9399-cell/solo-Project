import React from 'react';
import { cn } from '../../lib/utils';

interface BambooDividerProps {
  className?: string;
  withText?: boolean;
  text?: string;
  variant?: 'default' | 'dotted' | 'double';
}

export const BambooDivider: React.FC<BambooDividerProps> = ({
  className,
  withText = false,
  text,
  variant = 'default',
}) => {
  return (
    <div className={cn('relative my-6 flex items-center', className)}>
      <div className="flex-1 h-px relative">
        <div
          className="absolute inset-0"
          style={{
            background: variant === 'dotted'
              ? 'radial-gradient(circle, #D9B083 1px, transparent 1px)'
              : variant === 'double'
              ? 'linear-gradient(180deg, #D9B083 0%, #D9B083 40%, transparent 40%, transparent 60%, #D9B083 60%, #D9B083 100%)'
              : 'linear-gradient(90deg, transparent, #D9B083, transparent)',
            backgroundSize: variant === 'dotted' ? '8px 1px' : '100% 100%',
          }}
        />
      </div>

      {withText && text && (
        <div className="px-4 flex items-center">
          <div className="w-2 h-2 rounded-full bg-ochre-500 mr-2" />
          <span className="font-song text-ochre-700 text-sm">{text}</span>
          <div className="w-2 h-2 rounded-full bg-ochre-500 ml-2" />
        </div>
      )}

      <div className="flex-1 h-px relative">
        <div
          className="absolute inset-0"
          style={{
            background: variant === 'dotted'
              ? 'radial-gradient(circle, #D9B083 1px, transparent 1px)'
              : variant === 'double'
              ? 'linear-gradient(180deg, #D9B083 0%, #D9B083 40%, transparent 40%, transparent 60%, #D9B083 60%, #D9B083 100%)'
              : 'linear-gradient(90deg, transparent, #D9B083, transparent)',
            backgroundSize: variant === 'dotted' ? '8px 1px' : '100% 100%',
          }}
        />
      </div>

      {!withText && (
        <>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-ochre-400" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-ochre-400" />
        </>
      )}
    </div>
  );
};

export default BambooDivider;
