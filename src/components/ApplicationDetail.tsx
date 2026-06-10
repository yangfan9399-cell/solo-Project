'use client'
import { useState, useEffect } from 'react'
import { Button, Badge, Card, Divider, Avatar } from '@nextui-org/react'
import { ApplicationStatus, ApprovalRole, ApprovalStatus } from '@prisma/client'

interface ApplicationDetailProps {
  id: string
  onClose: () => void
}

export default function ApplicationDetail({ id, onClose }: ApplicationDetailProps) {
  const [application, setApplication] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [showRecallModal, setShowRecallModal] = useState(false)
  const [recallCandidates, setRecallCandidates] = useState<any[]>([])

  useEffect(() => {
    fetch(`/api/applications/${id}`).then((res) => res.json()).then(setApplication)
    fetch('/api/employees').then((res) => res.json()).then(setEmployees)
  }, [id])

  const getApproverByRole = (role: string) => {
    const approver = employees.find((emp) => emp.role === role)
    return approver?.id
  }

  const handleDepartmentApprove = async () => {
    const approverId = getApproverByRole('DEPARTMENT_HEAD')
    if (!approverId) {
      alert('未找到部门负责人')
      return
    }

    const response = await fetch(`/api/applications/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approverId,
        role: ApprovalRole.DEPARTMENT_HEAD,
        status: ApprovalStatus.APPROVED,
        comment: '同意申请',
      }),
    })
    if (response.ok) {
      const data = await response.json()
      setApplication(data)
      alert('部门审批通过')
    } else {
      const error = await response.json()
      alert(error.error || '审批失败')
    }
  }

  const handleITApprove = async () => {
    const approverId = getApproverByRole('IT_ADMIN')
    if (!approverId) {
      alert('未找到IT管理员')
      return
    }

    const response = await fetch(`/api/applications/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approverId,
        role: ApprovalRole.IT_ADMIN,
        status: ApprovalStatus.APPROVED,
        comment: '同意分配',
      }),
    })
    const data = await response.json()
    if (response.status === 400 && data.recallCandidates) {
      setRecallCandidates(data.recallCandidates)
      setShowRecallModal(true)
    } else if (response.ok) {
      setApplication(data.application)
      alert('许可证分配成功')
    } else {
      alert(data.error || '分配失败')
    }
  }

  const handleRecall = async (assignmentId: string) => {
    await fetch(`/api/assignments/${assignmentId}/recall`, { method: 'POST' })
    setShowRecallModal(false)
    alert('许可证已回收')
    await handleITApprove()
  }

  const handleAuditRecall = async () => {
    if (application.assignment?.id) {
      await fetch(`/api/assignments/${application.assignment.id}/recall`, { method: 'POST' })
      fetch(`/api/applications/${id}`).then((res) => res.json()).then(setApplication)
      alert('许可证已回收')
    }
  }

  if (!application) return <div className="p-8 text-center">加载中...</div>

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

  const getApprovalRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      DEPARTMENT_HEAD: '部门负责人',
      IT_ADMIN: 'IT管理员',
      AUDITOR: '审计员',
    }
    return roleMap[role] || role
  }

  const getApprovalStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: '待审批',
      APPROVED: '已批准',
      REJECTED: '已拒绝',
    }
    return statusMap[status] || status
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">申请详情</h2>
            <Button size="sm" variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
          <div className="mt-2">{getStatusBadge(application.status)}</div>
        </div>

        <div className="p-6 space-y-4">
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">软件名称</div>
                <div className="font-medium">{application.software?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">供应商</div>
                <div className="font-medium">{application.software?.vendor}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">申请人</div>
                <div className="font-medium">{application.employee?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">员工编号</div>
                <div className="font-medium">{application.employee?.employeeId}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">部门</div>
                <div className="font-medium">{application.department?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">申请席位</div>
                <div className="font-medium">{application.requestedSeats}</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-500 mb-2">使用范围</div>
            <div className="font-medium">{application.useScope}</div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-500 mb-2">申请理由</div>
            <div className="font-medium">{application.reason}</div>
          </Card>

          <Divider />

          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">审批历史</div>
            <div className="space-y-3">
              {application.approvals?.map((approval: any) => (
                <div
                  key={approval.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Avatar className="w-8 h-8">{approval.approver?.name?.[0] || '?'}</Avatar>
                  <div className="flex-1">
                    <div className="font-medium">
                      {approval.approver?.name} ({getApprovalRoleLabel(approval.role)})
                    </div>
                    <div className="text-sm text-gray-500">
                      {getApprovalStatusLabel(approval.status)}
                      {approval.comment && ` - ${approval.comment}`}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(approval.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
              {!application.approvals?.length && (
                <div className="text-center text-gray-400 py-4">暂无审批记录</div>
              )}
            </div>
          </div>

          {application.assignment && (
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-700 mb-3">分配信息</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">许可证密钥</div>
                  <div className="font-medium font-mono">
                    {application.assignment.license?.licenseKey}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">分配日期</div>
                  <div className="font-medium">
                    {new Date(application.assignment.assignedAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">到期日期</div>
                  <div className="font-medium">
                    {application.assignment.expiresAt
                      ? new Date(application.assignment.expiresAt).toLocaleDateString()
                      : '无'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">状态</div>
                  <div className="font-medium">{application.assignment.status}</div>
                </div>
              </div>
            </Card>
          )}

          <Divider />

          <div className="flex gap-3">
            {application.status === ApplicationStatus.PENDING && (
              <Button color="success" onClick={handleDepartmentApprove}>
                部门负责人审批通过
              </Button>
            )}
            {application.status === ApplicationStatus.DEPARTMENT_APPROVED && (
              <Button color="primary" onClick={handleITApprove}>
                IT管理员分配许可证
              </Button>
            )}
            {application.status === ApplicationStatus.ASSIGNED && application.assignment && (
              <Button color="danger" onClick={handleAuditRecall}>
                审计回收许可证
              </Button>
            )}
          </div>
        </div>
      </div>

      {showRecallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold">许可证不足</h3>
              <p className="text-sm text-gray-500 mt-1">
                当前软件许可证已用尽，请先回收以下用户的许可证
              </p>
            </div>
            <div className="p-6 max-h-60 overflow-y-auto">
              <div className="space-y-2">
                {recallCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{candidate.employee?.name}</div>
                      <div className="text-sm text-gray-500">
                        {candidate.employee?.employeeId}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      color="danger"
                      onClick={() => handleRecall(candidate.id)}
                    >
                      回收
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <Button variant="ghost" onClick={() => setShowRecallModal(false)}>
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}