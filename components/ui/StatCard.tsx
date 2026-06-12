"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  onClick,
  isActive,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "card p-6 transition-all cursor-pointer hover:shadow-md",
        isActive && "ring-2 ring-primary-500"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={cn("p-3 rounded-lg", bgColor)}>
          <Icon className={cn("w-6 h-6", color)} />
        </div>
      </div>
    </div>
  );
}
