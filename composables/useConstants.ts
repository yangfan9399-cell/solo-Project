export interface CurrentUser {
  id: number
  name: string
  role: 'APPLICANT' | 'PROCESSOR' | 'REVIEWER' | 'ARCHIVIST'
  department: string
}

export const statusLabels: Record<string, string> = {
  PENDING_ACCEPTANCE: '待受理',
  ACCEPTED: '已受理',
  PROCESSING: '处理中',
  PENDING_REVIEW: '待复核',
  REVIEW_PASSED: '复核通过',
  REVIEW_REJECTED: '复核退回',
  ARCHIVED: '已归档',
  REPROCESSING: '重新处理'
}

export const statusColors: Record<string, string> = {
  PENDING_ACCEPTANCE: 'default',
  ACCEPTED: 'primary',
  PROCESSING: 'warning',
  PENDING_REVIEW: 'warning',
  REVIEW_PASSED: 'success',
  REVIEW_REJECTED: 'error',
  ARCHIVED: 'default',
  REPROCESSING: 'primary'
}

export const abnormalTypeLabels: Record<string, string> = {
  NORMAL: '正常核销',
  MISSING_RECORD: '记录漏填',
  ATTACHMENT_VERSION_MISMATCH: '附件版本不一致',
  REPROCESS: '重新处理'
}

export const abnormalTypeColors: Record<string, string> = {
  NORMAL: 'success',
  MISSING_RECORD: 'error',
  ATTACHMENT_VERSION_MISMATCH: 'warning',
  REPROCESS: 'primary'
}

export const nodeTypeLabels: Record<string, string> = {
  ACCEPTANCE: '受理节点',
  PROCESSING: '处理节点',
  REVIEW: '复核节点',
  ARCHIVE: '归档节点',
  SUPPLEMENT: '补证节点',
  REPROCESS: '重处理节点'
}

export const diffTypeLabels: Record<string, string> = {
  KEY_TIME: '关键时间',
  RESPONSIBLE: '责任对象',
  AMOUNT_QUANTITY: '金额数量',
  EVIDENCE_CONCLUSION: '证据结论',
  OTHER: '其他'
}

export function useConstants() {
  return {
    statusLabels,
    statusColors,
    abnormalTypeLabels,
    abnormalTypeColors,
    nodeTypeLabels,
    diffTypeLabels
  }
}
