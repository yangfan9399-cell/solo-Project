export type SpecimenStatus = '待接收' | '复判中' | '已锁定' | '已退回'

export type Substrate = '树皮' | '岩石' | '土壤' | '苔藓层'

export type SporeDensity = '高' | '中' | '低' | '无'

export type HumidityExposure = '干燥' | '适中' | '湿润' | '水淹'

export type CollectionSource = '野外采集' | '送检' | '复测'

export type Season = '春' | '夏' | '秋' | '冬'

export interface Coords {
  lat: number
  lng: number
}

export interface User {
  id: string
  name: string
  role: string
}

export interface Assignment {
  id: number
  specimen_id: number
  assign_from?: string
  assign_to: string
  notes?: string
  assigned_at: string
}

export interface Rejection {
  id: number
  specimen_id: number
  rejected_by: string
  reason: string
  is_deficient?: boolean
  rejected_at: string
}

export interface LockRecord {
  id: number
  specimen_id: number
  locked_by: string
  unlock_reason?: string
  is_locked?: boolean
  locked_at: string
}

export interface ExportBatch {
  id: number
  batch_no: string
  exported_by: string
  included_ids: number[]
  excluded_ids: number[]
  exclusion_reasons: Record<string, string>
  exported_at: string
}

export interface Specimen {
  id: number
  status: SpecimenStatus
  specimen_no: string
  collection_point?: string
  collection_coords?: Coords
  collection_altitude?: number
  substrate?: Substrate
  spore_density?: SporeDensity
  humidity_exposure?: HumidityExposure
  collection_source?: CollectionSource
  micrograph_url?: string
  interpreter_opinion?: string
  original_belongs_to?: string
  current_belongs_to?: string
  is_remeasure?: boolean
  parent_specimen_id?: number
  season?: Season
  collection_date?: string
  created_at: string
  updated_at: string
}

export interface SpecimenDetail extends Specimen {
  assignments: Assignment[]
  rejections: Rejection[]
  lock_records: LockRecord[]
}

export interface SpecimenFilter {
  status?: SpecimenStatus[]
  substrate?: Substrate[]
  spore_density?: SporeDensity[]
  humidity_exposure?: HumidityExposure[]
  season?: Season[]
  search?: string
  date_from?: string
  date_to?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface BatchAssignRequest {
  specimen_ids: number[]
  assign_to: string
  notes?: string
}

export interface BatchRejectRequest {
  specimen_ids: number[]
  reason: string
  rejected_by: string
  is_deficient?: boolean
}

export interface ExportRequest {
  specimen_ids: number[]
  format: 'csv' | 'excel' | 'pdf'
  include_history?: boolean
}

export interface ExportPreviewResponse {
  exportable: Specimen[]
  excluded: Array<{ specimen_id: number; specimen_no: string; reason: string }>
}

export interface ReviewRequest {
  interpreter_opinion: string
  status?: SpecimenStatus
  current_belongs_to?: string
}

export interface LockRequest {
  locked_by: string
  unlock_reason?: string
}

export interface ReMeasureRecord {
  id: string
  specimen_id: string
  specimen_no: string
  season?: Season
  collection_date?: string
  collection_point?: string
  spore_density?: SporeDensity
  original_belongs_to?: string
  current_belongs_to?: string
  interpreter_opinion?: string
  measured_at: string
  measured_by: User
}

export interface HistoryRecord {
  specimen_id: number
  specimen_no: string
  collection_date?: string
  season?: Season
  original_belongs_to?: string
  current_belongs_to?: string
  interpreter_opinion?: string
  collection_point?: string
}
