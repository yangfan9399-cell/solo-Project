"use client";

import { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/types";
import { getStatusColor, cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn("badge", getStatusColor(status), className)}>
      {STATUS_LABELS[status]}
    </span>
  );
}
