import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertType = 'danger' | 'warning' | 'success' | 'info';

interface Props {
  type?: AlertType;
  title: string;
  message?: string;
  className?: string;
  onClose?: () => void;
}

const config: Record<AlertType, { icon: any; bg: string; border: string; title: string; iconColor: string }> = {
  danger: {
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    title: 'text-red-900',
    iconColor: 'text-red-600',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    title: 'text-amber-900',
    iconColor: 'text-amber-600',
  },
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    title: 'text-emerald-900',
    iconColor: 'text-emerald-600',
  },
  info: {
    icon: Info,
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    title: 'text-sky-900',
    iconColor: 'text-sky-600',
  },
};

export default function Alert({ type = 'info', title, message, className, onClose }: Props) {
  const c = config[type];
  const Icon = c.icon;
  return (
    <div className={cn('rounded-xl border px-4 py-3 flex gap-3', c.bg, c.border, className)}>
      <Icon size={20} className={cn('mt-0.5 shrink-0', c.iconColor)} />
      <div className="flex-1 min-w-0">
        <h4 className={cn('text-sm font-semibold', c.title)}>{title}</h4>
        {message && <p className="mt-1 text-sm text-slate-600">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition text-lg leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}
