export type BatchStatus = 'DRAFT' | 'PENDING_REVIEW' | 'SUBMITTED' | 'REJECTED' | 'ARCHIVED'

export type MaterialStatus = 'PENDING' | 'COMPLETE' | 'REJECTED' | 'EXPIRED' | 'EXPIRING_SOON'

export type VisaResult = 'PENDING' | 'APPROVED' | 'REJECTED' | null

export interface BatchWithDetails {
  id: number
  batchNo: string
  country: string
  status: BatchStatus
  submitDate: string | null
  createdAt: string
  createdBy: { name: string }
  reviewedBy?: { name: string } | null
  touristCount: number
  completeCount: number
  issueCount: number
}

export interface TouristWithDetails {
  id: number
  name: string
  passportNo: string
  passportExpire: string
  birthDate: string | null
  phone: string | null
  isPassportExpired: boolean
  isPassportExpiringSoon: boolean
  materials: MaterialWithStatus[]
  visaResult: VisaResult
  batchNotes: string | null
}

export interface MaterialWithStatus {
  id: number
  type: string
  status: MaterialStatus
  fileName: string | null
  notes: string | null
}

export interface AuditLogEntry {
  id: number
  action: string
  notes: string | null
  createdAt: string
  user: { name: string }
}

export interface ReviewStats {
  byCountry: { country: string; count: number; approved: number; rejected: number }[]
  byMaterialIssue: { issue: string; count: number }[]
  processingTime: { avg: number; max: number; min: number }
  rejectionCount: number
}
