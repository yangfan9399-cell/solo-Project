"use client";

import { DifferenceType } from "@prisma/client";
import { DIFFERENCE_TYPE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DifferenceTypeBadgeProps {
  type: DifferenceType;
  className?: string;
}

const colors: Record<DifferenceType, string> = {
  KEY_TIME: "bg-blue-100 text-blue-800",
  RESPONSIBLE_PARTY: "bg-purple-100 text-purple-800",
  AMOUNT: "bg-amber-100 text-amber-800",
  EVIDENCE_CONCLUSION: "bg-teal-100 text-teal-800",
  OTHER: "bg-gray-100 text-gray-800",
};

export function DifferenceTypeBadge({ type, className }: DifferenceTypeBadgeProps) {
  return (
    <span className={cn("badge", colors[type], className)}>
      {DIFFERENCE_TYPE_LABELS[type]}
    </span>
  );
}
