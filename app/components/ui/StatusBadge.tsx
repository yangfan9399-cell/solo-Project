import type { DonationStatus, ApplicationStatus, DistributionStatus, ExceptionStatus, InspectionResult } from "@prisma/client";

interface StatusBadgeProps {
  status: DonationStatus | ApplicationStatus | DistributionStatus | ExceptionStatus | InspectionResult;
  type: "donation" | "application" | "distribution" | "exception" | "inspection";
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const config = getStatusConfig(status, type);
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
}

function getStatusConfig(
  status: string,
  type: string
): { label: string; bgColor: string; textColor: string } {
  const configs: Record<string, Record<string, { label: string; bgColor: string; textColor: string }>> = {
    donation: {
      PENDING: { label: "待质检", bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
      INSPECTING: { label: "质检中", bgColor: "bg-blue-100", textColor: "text-blue-800" },
      APPROVED: { label: "质检通过", bgColor: "bg-green-100", textColor: "text-green-800" },
      REJECTED: { label: "质检驳回", bgColor: "bg-red-100", textColor: "text-red-800" },
      STORED: { label: "已入库", bgColor: "bg-emerald-100", textColor: "text-emerald-800" },
    },
    application: {
      PENDING: { label: "待审批", bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
      APPROVED: { label: "已通过", bgColor: "bg-green-100", textColor: "text-green-800" },
      REJECTED: { label: "已驳回", bgColor: "bg-red-100", textColor: "text-red-800" },
      DISTRIBUTED: { label: "已发放", bgColor: "bg-emerald-100", textColor: "text-emerald-800" },
      CANCELLED: { label: "已取消", bgColor: "bg-gray-100", textColor: "text-gray-800" },
    },
    distribution: {
      PREPARING: { label: "准备中", bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
      SHIPPED: { label: "已出库", bgColor: "bg-blue-100", textColor: "text-blue-800" },
      DELIVERED: { label: "已送达", bgColor: "bg-cyan-100", textColor: "text-cyan-800" },
      SIGNED: { label: "已签收", bgColor: "bg-green-100", textColor: "text-green-800" },
      CANCELLED: { label: "已取消", bgColor: "bg-gray-100", textColor: "text-gray-800" },
    },
    exception: {
      OPEN: { label: "待处理", bgColor: "bg-red-100", textColor: "text-red-800" },
      PROCESSING: { label: "处理中", bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
      RESOLVED: { label: "已解决", bgColor: "bg-green-100", textColor: "text-green-800" },
      CLOSED: { label: "已关闭", bgColor: "bg-gray-100", textColor: "text-gray-800" },
    },
    inspection: {
      PASSED: { label: "合格", bgColor: "bg-green-100", textColor: "text-green-800" },
      FAILED: { label: "不合格", bgColor: "bg-red-100", textColor: "text-red-800" },
      PARTIAL: { label: "部分合格", bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
    },
  };

  return configs[type]?.[status] || { label: status, bgColor: "bg-gray-100", textColor: "text-gray-800" };
}
