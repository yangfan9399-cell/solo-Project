"use client";

import { SampleCategory } from "@prisma/client";
import { SAMPLE_CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: SampleCategory | null;
  className?: string;
}

const categoryColors: Record<SampleCategory, string> = {
  NORMAL_CLOSE: "bg-green-100 text-green-800",
  MISSING_MATERIAL: "bg-red-100 text-red-800",
  INCONSISTENT_PARTY: "bg-orange-100 text-orange-800",
  REVIEW_REJECTED: "bg-rose-100 text-rose-800",
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  if (!category) return null;
  return (
    <span className={cn("badge", categoryColors[category], className)}>
      {SAMPLE_CATEGORY_LABELS[category]}
    </span>
  );
}
