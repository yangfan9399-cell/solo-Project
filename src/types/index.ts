export type AgreementStatus = 'PENDING' | 'SIGNED' | 'EVALUATED' | 'ACCEPTED' | 'COMPENSATED' | 'DISPUTED' | 'REVIEWING'

export type PaymentStatus = 'UNPAID' | 'PAID' | 'FROZEN'

export type EvaluationStatus = 'PENDING' | 'CONFIRMED' | 'DISPUTED' | 'REVIEWED'

export type AcceptanceStatus = 'PENDING' | 'PASSED' | 'FAILED'

export type CompensationStatus = 'PENDING' | 'REVIEWED' | 'APPROVED' | 'PAID'

export type NodeType = 
  | 'AGREEMENT_REGISTERED'
  | 'AGREEMENT_SIGNED'
  | 'EVALUATION_CONFIRMED'
  | 'AREA_DISPUTE'
  | 'ACCEPTANCE_PASSED'
  | 'ACCEPTANCE_FAILED'
  | 'COMPENSATION_REVIEWED'
  | 'COMPENSATION_APPROVED'
  | 'COMPENSATION_PAID'
  | 'FROZEN'
  | 'REVIEW_REQUESTED'

export interface Resident {
  id: string
  name: string
  idCardNumber: string
  phone: string
  address: string
  createdAt: Date
  updatedAt: Date
}

export interface House {
  id: string
  houseNumber: string
  area: number
  buildingType: string
  location: string
  district: string
  residentId: string
  createdAt: Date
  updatedAt: Date
}

export interface Evaluation {
  id: string
  agreementId: string
  evaluatorId: string
  evaluatorName: string
  grossArea: number
  netArea: number
  unitPrice: number
  totalAmount: number
  status: EvaluationStatus
  disputeReason?: string
  reviewed: boolean
  reviewResult?: string
  reviewDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Acceptance {
  id: string
  agreementId: string
  inspectorId: string
  inspectorName: string
  checkDate: Date
  status: AcceptanceStatus
  remarks?: string
  createdAt: Date
  updatedAt: Date
}

export interface Compensation {
  id: string
  agreementId: string
  reviewerId: string
  reviewerName: string
  reviewDate: Date
  amount: number
  status: CompensationStatus
  paymentDate?: Date
  remarks?: string
  createdAt: Date
  updatedAt: Date
}

export interface HistoryNode {
  id: string
  agreementId: string
  nodeType: NodeType
  operatorId: string
  operatorName: string
  timestamp: Date
  remarks?: string
}

export interface Agreement {
  id: string
  agreementNo: string
  houseId: string
  house?: House
  residentId: string
  resident?: Resident
  signingDate: Date
  status: AgreementStatus
  totalCompensation: number
  paymentStatus: PaymentStatus
  frozen: boolean
  freezeReason?: string
  handlerId: string
  handlerName: string
  createdAt: Date
  updatedAt: Date
  evaluation?: Evaluation
  acceptance?: Acceptance
  compensation?: Compensation
  historyNodes?: HistoryNode[]
}

export interface FilterOptions {
  district?: string
  buildingType?: string
  status?: AgreementStatus
  paymentStatus?: PaymentStatus
  search?: string
}

export interface ReviewStats {
  totalCount: number
  completedCount: number
  disputedCount: number
  pendingCount: number
  totalCompensation: number
  paidCompensation: number
}

export interface DistrictStats {
  district: string
  count: number
  totalCompensation: number
  avgDuration: number
}

export interface BuildingTypeStats {
  buildingType: string
  count: number
  totalCompensation: number
}

export interface DisputeReasonStats {
  reason: string
  count: number
}

export interface PaymentCycleStats {
  cycle: string
  count: number
  avgDays: number
}
