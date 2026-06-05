import { getStatusBadgeClass, getStatusText } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(status)}`}>
      {getStatusText(status)}
    </span>
  );
}
