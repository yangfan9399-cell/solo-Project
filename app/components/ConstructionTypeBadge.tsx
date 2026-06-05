import { CONSTRUCTION_TYPES } from "~/lib/utils";

interface ConstructionTypeBadgeProps {
  type: string;
  className?: string;
}

const typeColors: Record<string, string> = {
  ELECTRICAL: "bg-blue-100 text-blue-800",
  PLUMBING: "bg-cyan-100 text-cyan-800",
  HVAC: "bg-purple-100 text-purple-800",
  STRUCTURAL: "bg-orange-100 text-orange-800",
  DEMOLITION: "bg-red-100 text-red-800",
  DECORATION: "bg-pink-100 text-pink-800",
  FIRE_SAFETY: "bg-rose-100 text-rose-800",
  OTHER: "bg-slate-100 text-slate-800",
};

export function ConstructionTypeBadge({ type, className }: ConstructionTypeBadgeProps) {
  const typeInfo = CONSTRUCTION_TYPES.find((t) => t.value === type);
  const label = typeInfo?.label || type;
  const color = typeColors[type] || "bg-slate-100 text-slate-800";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className || ""}`}>
      {label}
    </span>
  );
}
