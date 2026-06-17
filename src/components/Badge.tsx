import { cn, alertLevelClasses, statusClasses } from '@/lib/utils';

type BadgeProps = {
  label: string;
  variant?: keyof typeof alertLevelClasses | keyof typeof statusClasses | 'default' | 'info';
  className?: string;
  pulse?: boolean;
};

export default function Badge({ label, variant = 'default', className, pulse }: BadgeProps) {
  let cls = 'inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ';
  if (variant in alertLevelClasses) {
    cls += alertLevelClasses[variant as keyof typeof alertLevelClasses];
  } else if (variant in statusClasses) {
    cls += statusClasses[variant as keyof typeof statusClasses];
  } else if (variant === 'info') {
    cls += 'bg-sky-100 text-sky-800 border-sky-200';
  } else {
    cls += 'bg-slate-100 text-slate-700 border-slate-200';
  }
  if (pulse) cls += ' animate-pulse';
  return <span className={cn(cls, className)}>{label}</span>;
}
