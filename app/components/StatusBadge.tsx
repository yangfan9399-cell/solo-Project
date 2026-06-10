interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "待执行":
        return "bg-slate-100 text-slate-700";
      case "执行中":
        return "bg-blue-100 text-blue-700";
      case "待复查":
        return "bg-amber-100 text-amber-700";
      case "已归档":
        return "bg-emerald-100 text-emerald-700";
      case "已退回":
        return "bg-red-100 text-red-700";
      case "待处理":
        return "bg-slate-100 text-slate-700";
      case "处理中":
        return "bg-blue-100 text-blue-700";
      case "已解决":
        return "bg-emerald-100 text-emerald-700";
      case "正常":
        return "bg-emerald-100 text-emerald-700";
      case "维保中":
        return "bg-blue-100 text-blue-700";
      case "故障":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${getStatusStyles(status)}`}>
      {status}
    </span>
  );
}
