import type { ILLRequestStatus } from "~/server/db";

interface Props {
  status: ILLRequestStatus;
}

const statusConfig: Record<ILLRequestStatus, { label: string; class: string }> = {
  pending: { label: "待匹配", class: "bg-yellow-100 text-yellow-800" },
  matched: { label: "已匹配", class: "bg-blue-100 text-blue-800" },
  approved: { label: "已审批", class: "bg-indigo-100 text-indigo-800" },
  shipped: { label: "运输中", class: "bg-purple-100 text-purple-800" },
  received: { label: "已到馆", class: "bg-cyan-100 text-cyan-800" },
  lending: { label: "借阅中", class: "bg-green-100 text-green-800" },
  renew_requested: { label: "续借申请中", class: "bg-orange-100 text-orange-800" },
  renew_approved: { label: "已续借", class: "bg-teal-100 text-teal-800" },
  overdue: { label: "已逾期", class: "bg-red-100 text-red-800" },
  returned: { label: "已归还", class: "bg-gray-100 text-gray-800" },
  completed: { label: "已完成", class: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "已拒绝", class: "bg-red-100 text-red-800" },
  cancelled: { label: "已取消", class: "bg-gray-200 text-gray-600" }
};

export default function StatusBadge(props: Props) {
  const config = statusConfig[props.status] || statusConfig.pending;
  
  return (
    <span class={`badge ${config.class}`}>
      {config.label}
    </span>
  );
}
