import { component$ } from '@builder.io/qwik';
import { clsx } from 'clsx';

interface StatusBadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export const StatusBadge = component$<StatusBadgeProps>(({ text, variant = 'default' }) => {
  const variants = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800',
  };

  return (
    <span class={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant])}>
      {text}
    </span>
  );
});
