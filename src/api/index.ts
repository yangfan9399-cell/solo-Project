const API_BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  })
  if (res.ok) {
    return res.json()
  }
  throw new Error(`HTTP error! status: ${res.status}`)
}

export interface WorkOrder {
  id: string
  orderNo: string
  status: string
  faultSource: string
  faultType: string
  deviceId: string
  deviceNo: string
  stationId: string
  stationName: string
  repairType?: string
  repairNote?: string
  repairDuration?: number
  assigneeId?: string
  assigneeName?: string
  isRepeat: boolean
  repeatCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
  partsFees?: PartsFee[]
  laborFees?: LaborFee[]
  processNodes?: ProcessNode[]
  evidences?: Evidence[]
}

export interface PartsFee {
  id: string
  orderId: string
  partName: string
  quantity: number
  unitPrice: number
  subtotal: number
  isDisputed: boolean
  disputeReason?: string
  adjustedPrice?: number
  adjustmentReason?: string
}

export interface LaborFee {
  id: string
  orderId: string
  amount: number
}

export interface ProcessNode {
  id: string
  orderId: string
  action: string
  operator: string
  operatorRole: string
  note?: string
  createdAt: string
}

export interface Evidence {
  id: string
  orderId: string
  type: string
  title: string
  url: string
}

export const workOrderApi = {
  getList: (params?: {
    status?: string
    faultType?: string
    stationId?: string
    keyword?: string
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
  }) => request<{ items: WorkOrder[]; total: number; page: number; pageSize: number }>(
    `/orders?${new URLSearchParams(params as any).toString()}`
  ),

  getDetail: (id: string) => request<WorkOrder>(`/orders/${id}`),

  getStats: () => request<any>(`/orders/stats`),

  create: (data: any) => request<WorkOrder>(`/orders`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  assign: (id: string, data: { assigneeId: string; assigneeName: string }) =>
    request<WorkOrder>(`/orders/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  repair: (id: string, data: { repairType: string; repairNote: string; repairDuration: number; operator: string }) =>
    request<WorkOrder>(`/orders/${id}/repair`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  submitSettlement: (id: string, operator: string) =>
    request<WorkOrder>(`/orders/${id}/submit-settlement`, {
      method: 'PUT',
      body: JSON.stringify({ operator })
    }),

  confirm: (id: string, operator: string) =>
    request<WorkOrder>(`/orders/${id}/confirm`, {
      method: 'PUT',
      body: JSON.stringify({ operator })
    }),

  dispute: (id: string, data: { disputeReason: string; operator: string }) =>
    request<WorkOrder>(`/orders/${id}/dispute`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  adjustFee: (id: string, data: { feeId: string; adjustedPrice: number; adjustmentReason: string; operator: string }) =>
    request<any>(`/orders/${id}/adjust`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  returnOrder: (id: string, operator: string) =>
    request<WorkOrder>(`/orders/${id}/return`, {
      method: 'PUT',
      body: JSON.stringify({ operator })
    }),

  getReviewByFaultType: () => request<any[]>(`/orders/review/by-fault-type`),
  getReviewByStation: () => request<any[]>(`/orders/review/by-station`),
  getReviewByRepairDuration: () => request<any[]>(`/orders/review/by-repair-duration`),
  getReviewByRepeatCount: () => request<any[]>(`/orders/review/by-repeat-count`),
  getReviewSummary: () => request<any>(`/orders/review/summary`)
}

export const partsFeeApi = {
  getByOrderId: (orderId: string) => request<PartsFee[]>(`/parts-fees/order/${orderId}`),
  create: (data: any) => request<PartsFee>(`/parts-fees`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: any) => request<PartsFee>(`/parts-fees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id: string) => request(`/parts-fees/${id}`, { method: 'DELETE' })
}

export const processNodeApi = {
  getByOrderId: (orderId: string) => request<ProcessNode[]>(`/process-nodes/order/${orderId}`)
}

export const evidenceApi = {
  getByOrderId: (orderId: string) => request<Evidence[]>(`/evidences/order/${orderId}`)
}
