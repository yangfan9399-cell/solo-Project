import axios from 'axios'
import type {
  Specimen,
  SpecimenDetail,
  Assignment,
  Rejection,
  LockRecord,
  ExportBatch,
  BatchAssignRequest,
  BatchRejectRequest,
  ReviewRequest,
  LockRequest,
  ExportPreviewResponse,
  HistoryRecord,
} from '@/types'

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

export const specimenApi = {
  getSpecimens: async (status?: string): Promise<Specimen[]> => {
    const params = status ? { status } : {}
    const response = await apiClient.get<Specimen[]>('/specimens', { params })
    return response.data
  },

  getSpecimen: async (id: number): Promise<SpecimenDetail> => {
    const response = await apiClient.get<SpecimenDetail>(`/specimens/${id}`)
    return response.data
  },

  reviewSpecimen: async (id: number, data: ReviewRequest): Promise<Specimen> => {
    const response = await apiClient.post<Specimen>(`/specimens/${id}/review`, data)
    return response.data
  },

  toggleLock: async (id: number, data: LockRequest): Promise<LockRecord> => {
    const response = await apiClient.post<LockRecord>(`/specimens/${id}/lock`, data)
    return response.data
  },

  getHistory: async (id: number): Promise<HistoryRecord[]> => {
    const response = await apiClient.get<HistoryRecord[]>(`/specimens/${id}/history`)
    return response.data
  },
}

export const assignmentApi = {
  batchAssign: async (data: BatchAssignRequest): Promise<Assignment[]> => {
    const response = await apiClient.post<Assignment[]>('/specimens/batch-assign', data)
    return response.data
  },

  getAssignments: async (): Promise<Assignment[]> => {
    const response = await apiClient.get<Assignment[]>('/assignments')
    return response.data
  },
}

export const rejectionApi = {
  batchReject: async (data: BatchRejectRequest): Promise<Rejection[]> => {
    const response = await apiClient.post<Rejection[]>('/specimens/batch-reject', data)
    return response.data
  },

  getRejections: async (): Promise<Rejection[]> => {
    const response = await apiClient.get<Rejection[]>('/rejections')
    return response.data
  },
}

export const exportApi = {
  previewExport: async (): Promise<ExportPreviewResponse> => {
    const response = await apiClient.get<ExportPreviewResponse>('/export/preview')
    return response.data
  },

  executeExport: async (): Promise<ExportBatch> => {
    const response = await apiClient.post<ExportBatch>('/export/execute')
    return response.data
  },

  getExportBatches: async (): Promise<ExportBatch[]> => {
    const response = await apiClient.get<ExportBatch[]>('/export-batches')
    return response.data
  },
}

export default apiClient
