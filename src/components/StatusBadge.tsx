interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: '待审批', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  approved: { label: '已审批', className: 'bg-blue-100 text-blue-800 border-blue-300' },
  rejected: { label: '已驳回', className: 'bg-red-100 text-red-800 border-red-300' },
  checked_in: { label: '已签到', className: 'bg-green-100 text-green-800 border-green-300' },
  checked_out: { label: '已签退', className: 'bg-gray-100 text-gray-800 border-gray-300' },
  timeout: { label: '超时未离', className: 'bg-orange-100 text-orange-800 border-orange-300' },
  cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-800 border-gray-300' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-300' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}
