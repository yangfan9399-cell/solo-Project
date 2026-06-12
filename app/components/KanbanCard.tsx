import { Link } from "@remix-run/react";

interface KanbanCardProps {
  title: string;
  count: number;
  color: string;
  filterKey: string;
  filterValue: string;
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

export default function KanbanCard({ title, count, color, filterKey, filterValue }: KanbanCardProps) {
  const colors = COLOR_MAP[color] ?? { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };

  return (
    <Link
      to={`/?${filterKey}=${filterValue}`}
      className={`card block hover:shadow-md transition-shadow border ${colors.border} ${colors.bg}`}
    >
      <div className={`text-sm font-medium ${colors.text}`}>{title}</div>
      <div className={`mt-2 text-3xl font-bold ${colors.text}`}>{count}</div>
    </Link>
  );
}
