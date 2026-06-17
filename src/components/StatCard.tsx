import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'sky';
  className?: string;
}

const colorMap: Record<string, string> = {
  indigo: 'from-indigo-500 to-violet-500',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
  red: 'from-rose-500 to-red-500',
  sky: 'from-sky-500 to-blue-500',
};

export default function StatCard({ label, value, sublabel, icon, trend, trendValue, color = 'indigo', className }: Props) {
  return (
    <div className={cn(
      'relative rounded-2xl bg-white border border-slate-200 shadow-sm p-5 overflow-hidden',
      className
    )}>
      <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', colorMap[color])} />
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          {(sublabel || trendValue) && (
            <div className="mt-2 flex items-center gap-2">
              {trendValue && (
                <span className={cn(
                  'inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full',
                  trend === 'up' ? 'bg-red-50 text-red-700' :
                  trend === 'down' ? 'bg-emerald-50 text-emerald-700' :
                  'bg-slate-100 text-slate-700'
                )}>
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
                </span>
              )}
              {sublabel && <span className="text-xs text-slate-500">{sublabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-md',
            colorMap[color]
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
