import { useState, useEffect } from 'react'
import { Button, Badge } from '@nextui-org/react'

interface ApplicationListProps {
  onViewDetail: (id: string) => void
}

export default function ApplicationList({ onViewDetail }: ApplicationListProps) {
  const [applications, setApplications] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/applications').then((res) => res.json()).then(setApplications)
  }, [])

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: '待审批',
      DEPARTMENT_APPROVED: '部门已批准',
      IT_APPROVED: 'IT已批准',
      REJECTED: '已拒绝',
      ASSIGNED: '已分配',
      RECALLED: '已回收',
    }

    const colorMap: Record<string, string> = {
      PENDING: 'warning',
      DEPARTMENT_APPROVED: 'success',
      IT_APPROVED: 'success',
      REJECTED: 'danger',
      ASSIGNED: 'primary',
      RECALLED: 'default',
    }

    return (
      <Badge color={colorMap[status] as any || 'default'} variant="solid">
        {statusMap[status] || status}
      </Badge>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">软件</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部门</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {applications.map((app) => (
            <tr key={app.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.software?.name || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.employee?.name || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.department?.name || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(app.status)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Button size="sm" onClick={() => onViewDetail(app.id)}>
                  查看详情
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}