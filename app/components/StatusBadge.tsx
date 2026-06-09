import type { TrademarkStatus, DocumentStatus } from "@prisma/client";

const statusConfig: Record<TrademarkStatus, { label: string; className: string }> = {
  DRAFT: { label: "草稿", className: "bg-gray-100 text-gray-800" },
  PENDING_UPLOAD: { label: "待上传材料", className: "bg-yellow-100 text-yellow-800" },
  MATERIALS_UPLOADED: { label: "材料已上传", className: "bg-blue-100 text-blue-800" },
  MATERIALS_DEFICIENT: { label: "材料缺失", className: "bg-red-100 text-red-800" },
  AGENT_APPROVED: { label: "代理人审核通过", className: "bg-green-100 text-green-800" },
  SUBMITTED: { label: "已递交", className: "bg-purple-100 text-purple-800" },
  SUPERVISOR_REVIEW: { label: "主管复核中", className: "bg-indigo-100 text-indigo-800" },
  ARCHIVED: { label: "已归档", className: "bg-green-100 text-green-800" },
  ABANDONED: { label: "客户放弃", className: "bg-gray-100 text-gray-800" },
  EXPEDITED: { label: "临期加急", className: "bg-red-100 text-red-800" },
};

const docStatusConfig: Record<DocumentStatus, { label: string; className: string }> = {
  PENDING: { label: "待上传", className: "bg-gray-100 text-gray-800" },
  UPLOADED: { label: "已上传", className: "bg-blue-100 text-blue-800" },
  APPROVED: { label: "已通过", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "已驳回", className: "bg-red-100 text-red-800" },
};

export function StatusBadge({ status }: { status: TrademarkStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`badge ${config.className}`}>
      {config.label}
    </span>
  );
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const config = docStatusConfig[status];
  return (
    <span className={`badge ${config.className}`}>
      {config.label}
    </span>
  );
}

export { statusConfig, docStatusConfig };
