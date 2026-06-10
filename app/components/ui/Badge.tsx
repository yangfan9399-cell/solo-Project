import type { ReactNode } from "react";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variantStyles = {
    default: "bg-gray-100 text-gray-800",
    primary: "bg-primary-100 text-primary-800",
    success: "bg-success-100 text-success-600",
    warning: "bg-warning-100 text-warning-600",
    danger: "bg-danger-100 text-danger-600",
    info: "bg-blue-100 text-blue-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
    PENDING: { label: "待审批", variant: "warning" },
    APPROVED: { label: "已审批", variant: "primary" },
    REJECTED: { label: "已拒绝", variant: "danger" },
    EQUIPMENT_HANDED: { label: "设备已交接", variant: "info" },
    IN_USE: { label: "使用中", variant: "info" },
    RETURN_PENDING: { label: "待归还", variant: "warning" },
    COMPLETED: { label: "已完成", variant: "success" },
    CANCELLED: { label: "已取消", variant: "danger" },
  };

  const config = statusConfig[status] || { label: status, variant: "default" as BadgeVariant };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
