export enum RecordStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  REVIEW = 'REVIEW',
  ARCHIVED = 'ARCHIVED',
  REJECTED = 'REJECTED',
  REOPENED = 'REOPENED'
}

export enum NodeType {
  ACCEPT = 'ACCEPT',
  PROCESS = 'PROCESS',
  SUPPLEMENT = 'SUPPLEMENT',
  REVIEW = 'REVIEW',
  ARCHIVE = 'ARCHIVE',
  REJECT = 'REJECT',
  REOPEN = 'REOPEN'
}

export enum UserRole {
  APPLICANT = 'APPLICANT',
  REVIEWER = 'REVIEWER',
  ADMIN = 'ADMIN'
}

export enum SampleType {
  NORMAL_VERIFICATION = 'NORMAL_VERIFICATION',
  MISSING_FIELDS = 'MISSING_FIELDS',
  ATTACHMENT_MISMATCH = 'ATTACHMENT_MISMATCH',
  REPROCESS = 'REPROCESS'
}

export interface UserInfo {
  id: string
  name: string
  role: UserRole
}

export interface PumpStation {
  id: string
  name: string
  code: string
  location: string
  description?: string | null
}

export interface FieldDiffData {
  id?: string
  fieldName: string
  fieldLabel: string
  oldValue: string
  newValue: string
  diffType: string
}

export interface AttachmentData {
  id?: string
  name: string
  url: string
  version: string
  fileType: string
  size: number
}

export interface RecordSummary {
  id: string
  recordNo: string
  title: string
  status: RecordStatus
  source: string
  stationName: string
  currentHandlerId: string
  keyObject: string
  currentHandlerName: string
  occurrenceTime: string
  amount: string
  evidenceConclusion: string
  sampleType: SampleType | null
  isArchived: boolean
  updatedAt: string
}

export interface RecordDetail extends RecordSummary {
  description: string
  station: {
    id: string
    name: string
    code: string
    location: string
  }
  currentHandler: UserInfo
  nodes: RecordNodeData[]
  attachments: AttachmentData[]
  fieldDiffs: FieldDiffData[]
  createdAt: string
  archivedAt?: string
  archivedBy?: string
}

export interface RecordNodeData {
  id: string
  nodeType: NodeType
  operatorId: string
  operatorName: string
  remark: string | null
  blockReason: string | null
  remedyPath: string | null
  beforeSnapshot: Record<string, any>
  afterSnapshot: Record<string, any>
  createdAt: string
  attachments: AttachmentData[]
  fieldDiffs: FieldDiffData[]
}

export interface NodeActionPayload {
  recordId: string
  operatorId: string
  operatorName: string
  remark?: string
  blockReason?: string
  remedyPath?: string
  businessRecord?: string
  siteDescription?: string
  evidenceConclusion?: string
  attachments?: AttachmentData[]
  updatedFields?: Partial<{
    occurrenceTime: string
    keyObject: string
    amount: number
    evidenceConclusion: string
  }>
}

export interface StatisticsData {
  total: number
  pending: number
  processing: number
  review: number
  archived: number
  rejected: number
  reopened: number
  bySampleType: {
    type: SampleType
    count: number
  }[]
  byStation: {
    stationId: string
    stationName: string
    count: number
  }[]
  amountTotal: string
  recentTrend: {
    date: string
    count: number
  }[]
}

export const STATUS_LABELS: Record<RecordStatus, string> = {
  [RecordStatus.PENDING]: '待受理',
  [RecordStatus.PROCESSING]: '处理中',
  [RecordStatus.REVIEW]: '复核中',
  [RecordStatus.ARCHIVED]: '已归档',
  [RecordStatus.REJECTED]: '已退回',
  [RecordStatus.REOPENED]: '重新处理'
}

export const STATUS_COLORS: Record<RecordStatus, string> = {
  [RecordStatus.PENDING]: 'bg-amber-100 text-amber-800',
  [RecordStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
  [RecordStatus.REVIEW]: 'bg-purple-100 text-purple-800',
  [RecordStatus.ARCHIVED]: 'bg-green-100 text-green-800',
  [RecordStatus.REJECTED]: 'bg-red-100 text-red-800',
  [RecordStatus.REOPENED]: 'bg-orange-100 text-orange-800'
}

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  [NodeType.ACCEPT]: '受理登记',
  [NodeType.PROCESS]: '处理完成',
  [NodeType.SUPPLEMENT]: '补充资料',
  [NodeType.REVIEW]: '复核确认',
  [NodeType.ARCHIVE]: '归档完成',
  [NodeType.REJECT]: '退回补证',
  [NodeType.REOPEN]: '重新处理'
}

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  [NodeType.ACCEPT]: 'bg-gray-100 text-gray-800',
  [NodeType.PROCESS]: 'bg-blue-100 text-blue-800',
  [NodeType.SUPPLEMENT]: 'bg-cyan-100 text-cyan-800',
  [NodeType.REVIEW]: 'bg-purple-100 text-purple-800',
  [NodeType.ARCHIVE]: 'bg-green-100 text-green-800',
  [NodeType.REJECT]: 'bg-red-100 text-red-800',
  [NodeType.REOPEN]: 'bg-orange-100 text-orange-800'
}

export const SAMPLE_TYPE_LABELS: Record<SampleType, string> = {
  [SampleType.NORMAL_VERIFICATION]: '正常核销',
  [SampleType.MISSING_FIELDS]: '记录漏填',
  [SampleType.ATTACHMENT_MISMATCH]: '附件版本不一致',
  [SampleType.REPROCESS]: '重新处理'
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.APPLICANT]: '申请人',
  [UserRole.REVIEWER]: '复核人',
  [UserRole.ADMIN]: '管理员'
}
