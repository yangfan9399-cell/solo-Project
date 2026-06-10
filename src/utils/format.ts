export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(date: Date | string | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: '待处理',
    SIGNED: '已签约',
    EVALUATED: '已评估',
    ACCEPTED: '已验收',
    COMPENSATED: '已发放',
    DISPUTED: '争议处理中',
    REVIEWING: '复核中',
    UNPAID: '未发放',
    PAID: '已发放',
    FROZEN: '已冻结',
    CONFIRMED: '已确认',
    REVIEWED: '已复核',
    PASSED: '通过',
    FAILED: '未通过',
    APPROVED: '已审批',
  }
  return statusMap[status] || status
}

export function getNodeTypeText(nodeType: string): string {
  const nodeMap: Record<string, string> = {
    AGREEMENT_REGISTERED: '协议登记',
    AGREEMENT_SIGNED: '协议签订',
    EVALUATION_CONFIRMED: '面积确认',
    AREA_DISPUTE: '面积争议',
    ACCEPTANCE_PASSED: '验收通过',
    ACCEPTANCE_FAILED: '验收未通过',
    COMPENSATION_REVIEWED: '补偿复核',
    COMPENSATION_APPROVED: '补偿审批',
    COMPENSATION_PAID: '补偿发放',
    FROZEN: '冻结补偿',
    REVIEW_REQUESTED: '申请复核',
  }
  return nodeMap[nodeType] || nodeType
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    PENDING: 'badge-default',
    SIGNED: 'badge-info',
    EVALUATED: 'badge-info',
    ACCEPTED: 'badge-info',
    COMPENSATED: 'badge-success',
    DISPUTED: 'badge-danger',
    REVIEWING: 'badge-warning',
    UNPAID: 'badge-default',
    PAID: 'badge-success',
    FROZEN: 'badge-danger',
    CONFIRMED: 'badge-success',
    REVIEWED: 'badge-success',
    PASSED: 'badge-success',
    FAILED: 'badge-danger',
    APPROVED: 'badge-success',
  }
  return colorMap[status] || 'badge-default'
}
