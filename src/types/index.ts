export type FiberStatus =
  | 'DRAFT'
  | 'PRECHECK_PASS'
  | 'PRECHECK_FAIL'
  | 'PENDING_JUDGE'
  | 'JUDGED_PASS'
  | 'JUDGED_FAIL'
  | 'RETURNED_FOR_REVIEW'
  | 'LOCKED'
  | 'ARCHIVED'

export interface FiberLengthDistribution {
  short: number
  medium: number
  long: number
  weightedAverage?: number
}

export interface DryingRecord {
  id: string
  conditionId: string
  conditionName: string
  temperatureC: number
  durationMin: number
  wetWeightG: number
  dryWeightG: number
  moistureContent: number
  operatorId: string
  operatorName: string
  recordedAt: string
  notes?: string
}

export interface MicroPhoto {
  id: string
  url: string
  caption: string
  magnification: string
  capturedAt: string
  capturedBy: string
}

export interface AuditLog {
  id: string
  action: string
  operatorId: string
  operatorName: string
  timestamp: string
  fromStatus?: FiberStatus
  toStatus?: FiberStatus
  note?: string
}

export interface FiberSample {
  id: string
  sampleCode: string
  pulpBatch: string
  fiberLength: FiberLengthDistribution
  whiteness: number | null
  moistureContent: number | null
  sourceType: 'PURCHASE' | 'PRODUCTION' | 'RETURNED'
  sourceInfo: string
  operatorId: string
  operatorName: string
  responsiblePersonId: string
  responsiblePersonName: string
  registeredAt: string
  judgeConclusion?: 'PASS' | 'FAIL' | 'CONFLICT' | null
  judgeRemark?: string
  judgeBy?: string
  judgeAt?: string
  status: FiberStatus
  microPhotos: MicroPhoto[]
  dryingRecords: DryingRecord[]
  auditLogs: AuditLog[]
  tags: string[]
  conflictWithSampleId?: string
  isDuplicate?: boolean
  duplicateOfSampleId?: string
  missingFields: string[]
}

export interface PrecheckIssue {
  rowIndex: number
  sampleCode?: string
  field?: string
  severity: 'ERROR' | 'WARNING' | 'INFO'
  type:
    | 'MISSING_FIELD'
    | 'INVALID_RANGE'
    | 'INVALID_FORMAT'
    | 'DUPLICATE'
    | 'CONFLICT_BATCH'
    | 'UNKNOWN'
  message: string
}

export interface PrecheckResult {
  totalRows: number
  passRows: number
  issues: PrecheckIssue[]
  duplicateGroups: string[][]
  conflictGroups: string[][]
  missingFieldSummary: Record<string, number>
}

export interface ImportRow {
  sampleCode: string
  pulpBatch: string
  fiberShort: string
  fiberMedium: string
  fiberLong: string
  whiteness: string
  moistureContent: string
  sourceType: string
  sourceInfo: string
  operatorName: string
  responsiblePersonName: string
}

export interface FilterState {
  keyword: string
  status: FiberStatus | 'ALL'
  sourceType: 'ALL' | 'PURCHASE' | 'PRODUCTION' | 'RETURNED'
  pulpBatch: string
  hasIssues: 'ALL' | 'YES' | 'NO'
  judgeConclusion: 'ALL' | 'PASS' | 'FAIL' | 'CONFLICT'
  page: number
  pageSize: number
}

export const STATUS_META: Record<FiberStatus, { label: string; color: string; bg: string; border: string }> = {
  DRAFT: { label: '草稿', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
  PRECHECK_PASS: { label: '预检通过', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  PRECHECK_FAIL: { label: '预检失败', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  PENDING_JUDGE: { label: '待判读', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  JUDGED_PASS: { label: '判读合格', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  JUDGED_FAIL: { label: '判读不合格', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  RETURNED_FOR_REVIEW: { label: '退回复判', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  LOCKED: { label: '已锁定', color: 'text-slate-800', bg: 'bg-slate-100', border: 'border-slate-300' },
  ARCHIVED: { label: '已归档', color: 'text-zinc-600', bg: 'bg-zinc-50', border: 'border-zinc-200' },
}

export const SOURCE_META = {
  PURCHASE: { label: '采购入库', color: 'text-brand-700', bg: 'bg-brand-50', border: 'border-brand-200' },
  PRODUCTION: { label: '生产批次', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  RETURNED: { label: '退货复检', color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200' },
}

export const JUDGE_META = {
  PASS: { label: '合格', color: 'text-green-700', bg: 'bg-green-50' },
  FAIL: { label: '不合格', color: 'text-red-700', bg: 'bg-red-50' },
  CONFLICT: { label: '判读冲突', color: 'text-orange-700', bg: 'bg-orange-50' },
}
