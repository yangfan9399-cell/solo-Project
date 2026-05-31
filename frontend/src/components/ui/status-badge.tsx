import { component$, useStylesScoped$ } from '@builder.io/qwik';
import clsx from 'clsx';
import { DISEASE_SEVERITY_LABELS, BOOK_STATUS_LABELS, PROCESS_STATUS_LABELS, REVIEW_STATUS_LABELS } from '~/constants';

interface StatusBadgeProps {
  status: string;
  type: 'severity' | 'book' | 'process' | 'review';
}

export const StatusBadge = component$<StatusBadgeProps>(({ status, type }) => {
  const severityColors: Record<string, string> = {
    mild: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    severe: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  const bookColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    diagnosing: 'bg-blue-100 text-blue-800',
    scheduled: 'bg-purple-100 text-purple-800',
    repairing: 'bg-yellow-100 text-yellow-800',
    reviewing: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    archived: 'bg-gray-200 text-gray-600',
  };

  const processColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    skipped: 'bg-gray-200 text-gray-600',
  };

  const reviewColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    need_revision: 'bg-orange-100 text-orange-800',
  };

  const labels: Record<string, Record<string, string>> = {
    severity: DISEASE_SEVERITY_LABELS,
    book: BOOK_STATUS_LABELS,
    process: PROCESS_STATUS_LABELS,
    review: REVIEW_STATUS_LABELS,
  };

  const colors: Record<string, Record<string, string>> = {
    severity: severityColors,
    book: bookColors,
    process: processColors,
    review: reviewColors,
  };

  const label = labels[type][status] || status;
  const colorClass = colors[type][status] || 'bg-gray-100 text-gray-800';

  return (
    <span class={clsx('badge', colorClass)}>
      {label}
    </span>
  );
});
