import { PERMIT_STATUS_LABELS, PERMIT_STATUS_COLORS, cn } from "~/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = PERMIT_STATUS_LABELS[status as keyof typeof PERMIT_STATUS_LABELS] || status;
  const colorClass = PERMIT_STATUS_COLORS[status as keyof typeof PERMIT_STATUS_COLORS] || "badge-slate";

  return (
    <span className={cn(colorClass, className)}>
      {label}
    </span>
  );
}
