export interface ConsumableRecord {
  id: number
  recordNo: string
  status: string
  sourceType: string
  sourceId: string | null
  patientName: string
  patientId: string
  deptName: string
  wardName: string | null
  bedNo: string | null
  consumableName: string
  consumableCode: string
  specification: string
  manufacturer: string | null
  batchNo: string
  serialNo: string | null
  quantity: number
  unit: string
  unitPrice: number
  totalAmount: number
  implantDate: string | null
  implantLocation: string | null
  surgeonName: string | null
  nurseName: string | null
  isAbnormal: boolean
  abnormalType: string | null
  abnormalReason: string | null
  conclusion: string | null
  currentHandlerId: number | null
  applicantName: string
  applyDept: string
  applyTime: string
  acceptTime: string | null
  processTime: string | null
  reviewTime: string | null
  archiveTime: string | null
  reviewBasis: string | null
  blockingReason: string | null
  remedialPath: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface ReviewNode {
  id: number
  recordId: number
  nodeType: string
  nodeStatus: string
  nodeName: string
  nodeOrder: number
  operatorId: number | null
  operatorName: string | null
  handlerId: number | null
  handlerName: string | null
  content: string | null
  basis: string | null
  blockingReason: string | null
  remedialPath: string | null
  remark: string | null
  createdAt: string
  completedAt: string | null
}

export interface Attachment {
  id: number
  recordId: number
  nodeId: number | null
  fileName: string
  fileType: string
  fileUrl: string
  fileSize: number | null
  version: number
  uploadedBy: string
  uploadedAt: string
  isEvidence: boolean
}

export interface FieldDiff {
  id: number
  recordId: number
  nodeId: number | null
  fieldName: string
  fieldLabel: string
  oldValue: string | null
  newValue: string | null
  diffType: string
  changedAt: string
  changedBy: string | null
}

export interface User {
  id: number
  name: string
  role: string
  department: string
  phone: string | null
}

export type UserRole = 'APPLICANT' | 'PROCESSOR' | 'REVIEWER' | 'ARCHIVIST'
export type RecordStatus = 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'PROCESSING' | 'PENDING_REVIEW' | 'REVIEW_PASSED' | 'REVIEW_REJECTED' | 'ARCHIVED' | 'REPROCESSING'
export type AbnormalType = 'NORMAL' | 'MISSING_RECORD' | 'ATTACHMENT_VERSION_MISMATCH' | 'REPROCESS'
export type NodeType = 'ACCEPTANCE' | 'PROCESSING' | 'REVIEW' | 'ARCHIVE' | 'SUPPLEMENT' | 'REPROCESS'
export type NodeStatus = 'PENDING' | 'COMPLETED' | 'REJECTED'
export type DiffType = 'KEY_TIME' | 'RESPONSIBLE' | 'AMOUNT_QUANTITY' | 'EVIDENCE_CONCLUSION' | 'OTHER'
