import React from 'react';
import { cn } from '../../lib/utils';

interface ScrollCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export const ScrollCard: React.FC<ScrollCardProps> = ({
  children,
  className,
  style,
  header,
  footer,
  hover = false,
  clickable = false,
  onClick,
}) => {
  return (
    <div
      className={cn(
        'relative bg-paper-100 rounded-lg border border-ochre-200 shadow-scroll overflow-hidden',
        'transition-all duration-300',
        hover && 'hover:shadow-lg hover:-translate-y-1',
        clickable && 'cursor-pointer',
        className
      )}
      onClick={clickable ? onClick : undefined}
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(139, 69, 19, 0.02) 0%, transparent 40%),
          radial-gradient(circle at 80% 80%, rgba(139, 69, 19, 0.03) 0%, transparent 40%)
        `,
        ...style,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, transparent, #8B4513, transparent)',
          opacity: 0.3,
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, transparent, #8B4513, transparent)',
          opacity: 0.3,
        }}
      />

      <div
        className="absolute top-0 bottom-0 left-0 w-px"
        style={{
          background: 'linear-gradient(180deg, transparent, #D9B083, transparent)',
          opacity: 0.5,
        }}
      />

      <div
        className="absolute top-0 bottom-0 right-0 w-px"
        style={{
          background: 'linear-gradient(180deg, transparent, #D9B083, transparent)',
          opacity: 0.5,
        }}
      />

      {header && (
        <div className="relative px-6 py-4 border-b border-ochre-100 bg-ochre-50/50">
          {header}
        </div>
      )}

      <div className="relative p-6">{children}</div>

      {footer && (
        <div className="relative px-6 py-4 border-t border-ochre-100 bg-ochre-50/30">
          {footer}
        </div>
      )}

      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B4513' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default ScrollCard;
