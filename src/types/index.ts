export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'shipping_out'
  | 'in_transit'
  | 'arrived'
  | 'reading'
  | 'renewal_pending'
  | 'renewal_approved'
  | 'renewal_rejected'
  | 'returning'
  | 'completed'
  | 'overdue'
  | 'exception'

export interface InterlibraryRequest {
  id: number
  request_no: string
  isbn: string
  title: string
  author: string
  publisher: string
  reader_name: string
  reader_phone: string
  reader_email: string
  library_id: number
  library_name?: string
  library_code?: string
  status: RequestStatus
  request_type: string
  purpose: string
  due_date: string | null
  actual_return_date: string | null
  notes: string
  created_by: number
  created_at: string
  updated_at: string
  shipping_records?: ShippingRecord[]
  renewal_requests?: RenewalRequest[]
}

export interface ShippingRecord {
  id: number
  request_id: number
  carrier: string
  tracking_number: string
  shipped_date: string | null
  estimated_arrival: string | null
  actual_arrival: string | null
  return_tracking_number: string
  return_shipped_date: string | null
  notes: string
  created_at: string
}

export interface RenewalRequest {
  id: number
  request_id: number
  original_due_date: string
  requested_due_date: string
  reason: string
  status: string
  reviewed_by: number | null
  reviewed_at: string | null
  created_at: string
}

export interface OverdueRecord {
  id: number
  request_id: number
  due_date: string
  overdue_days: number
  reminder_count: number
  last_reminder_date: string | null
  fine_amount: number
  status: string
  created_at: string
  request_no?: string
  title?: string
  reader_name?: string
  isbn?: string
  library_name?: string
  library_code?: string
}

export interface ExceptionRecord {
  id: number
  request_id: number
  type: string
  description: string
  handler_id: number | null
  handler_name: string | null
  resolution: string | null
  status: string
  created_at: string
  updated_at: string
  request_no?: string
  title?: string
  reader_name?: string
  isbn?: string
  library_name?: string
}

export interface PartnerLibrary {
  id: number
  name: string
  code: string
  contact_person: string
  contact_phone: string
  contact_email: string
  address: string
  province: string
  city: string
  cooperation_level: string
  status: string
  created_at: string
  holdings?: LibraryHolding[]
  request_count?: number
}

export interface LibraryHolding {
  id: number
  library_id: number
  isbn: string
  title: string
  author: string
  publisher: string
  call_number: string
  available: boolean
  location: string
  created_at: string
  library_name?: string
  library_code?: string
}

export interface StatusTransition {
  id: number
  request_id: number
  from_status: RequestStatus | null
  to_status: RequestStatus
  operated_by: number
  operator_name: string
  remark: string
  created_at: string
  request_no?: string
}

export interface DashboardStats {
  pending_count: number
  in_progress_count: number
  overdue_count: number
  completed_this_month: number
  total_requests: number
  exception_count: number
}

export interface Activity {
  id: number
  request_id: number
  request_no: string
  from_status: RequestStatus | null
  to_status: RequestStatus
  operator_name: string
  remark: string
  created_at: string
}

export interface TodoItem {
  id: number
  request_id: number
  type: string
  title: string
  description: string
  request_no: string
  priority: string
  created_at: string
}
