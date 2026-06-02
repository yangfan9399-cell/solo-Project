export type UserRole = 'admin' | 'operator' | 'quality'

export interface User {
  id: number
  username: string
  name: string
  role: UserRole
  department: string
  createdAt: string
}

export type ToolStatus = 'available' | 'borrowed' | 'calibrating' | 'maintenance' | 'scrapped'

export interface Tool {
  id: number
  code: string
  name: string
  specification: string
  manufacturer: string
  model: string
  serialNumber: string
  measurementRange: string
  accuracy: string
  department: string
  location: string
  status: ToolStatus
  calibrationCycleDays: number
  lastCalibrationDate: string | null
  nextCalibrationDate: string | null
  purchaseDate: string
  price: number
  remark: string
  createdAt: string
  updatedAt: string
  hasPendingBorrow?: boolean
  isBorrowedActive?: boolean
}

export type BorrowStatus = 'pending' | 'approved' | 'rejected' | 'borrowed' | 'returned' | 'overdue'

export interface BorrowRecord {
  id: number
  toolId: number
  toolCode: string
  toolName: string
  applicantId: number
  applicantName: string
  applicantDepartment: string
  purpose: string
  expectedReturnDate: string
  status: BorrowStatus
  approverId: number | null
  approverName: string | null
  approvalRemark: string | null
  approvedAt: string | null
  handoverPersonId: number | null
  handoverPersonName: string | null
  handedOverAt: string | null
  returnInspectorId: number | null
  returnInspectorName: string | null
  returnCondition: string | null
  returnedAt: string | null
  remark: string | null
  createdAt: string
  updatedAt: string
}

export type CalibrationStatus = 'scheduled' | 'in_progress' | 'passed' | 'failed'

export interface CalibrationRecord {
  id: number
  toolId: number
  toolCode: string
  toolName: string
  plannedDate: string
  actualDate: string | null
  status: CalibrationStatus
  calibrationAgency: string
  certificateNumber: string | null
  calibrationResult: string | null
  nextCalibrationDate: string | null
  cost: number | null
  inspectorId: number | null
  inspectorName: string | null
  remark: string | null
  createdAt: string
  updatedAt: string
}

export type FeedbackStatus = 'open' | 'processing' | 'resolved' | 'closed'

export interface Feedback {
  id: number
  toolId: number | null
  toolCode: string | null
  reporterId: number
  reporterName: string
  type: string
  title: string
  description: string
  status: FeedbackStatus
  handlerId: number | null
  handlerName: string | null
  handleResult: string | null
  handledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalTools: number
  availableTools: number
  borrowedTools: number
  calibratingTools: number
  pendingBorrows: number
  overdueBorrows: number
  calibrationDueSoon: number
  calibrationOverdue: number
  openFeedbacks: number
}
