import { STATUS_LABELS } from "~/lib/types";
import type { AppStatus } from "~/lib/types";

const BADGE_CLASSES: Record<AppStatus, string> = {
  received: "badge-received",
  processing: "badge-processing",
  review: "badge-review",
  archived: "badge-archived",
  returned: "badge-returned",
  reprocessing: "badge-reprocessing",
};

interface StatusBadgeProps {
  status: AppStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={BADGE_CLASSES[status]}>
      {STATUS_LABELS[status]}
    </span>
  );
}
