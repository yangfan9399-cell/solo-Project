import { getConflictTypeText } from "@/lib/utils";

interface ConflictBadgeProps {
  conflictType: string;
}

export default function ConflictBadge({ conflictType }: ConflictBadgeProps) {
  if (conflictType === "none") return null;

  const badgeClasses: Record<string, string> = {
    batch_mismatch: "bg-red-100 text-red-800 border-red-200",
    quantity_exceeded: "bg-orange-100 text-orange-800 border-orange-200",
    store_conflict: "bg-purple-100 text-purple-800 border-purple-200",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badgeClasses[conflictType] || "bg-gray-100 text-gray-800"}`}>
      ⚠️ {getConflictTypeText(conflictType)}
    </span>
  );
}
