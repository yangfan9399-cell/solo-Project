import type { FiberSample, FilterState, ImportRow, PrecheckResult, FiberStatus, DryingRecord, MicroPhoto } from '../types'

const API_BASE = '/api'

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) throw new Error(`API Error ${res.status}: ${res.statusText}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  precheck: (text: string): Promise<{ data: PrecheckResult; rows: ImportRow[] }> =>
    request('/precheck', { method: 'POST', body: JSON.stringify({ text }) }),

  doImport: (text: string): Promise<{ added: number; samples: FiberSample[] }> =>
    request('/import', { method: 'POST', body: JSON.stringify({ text }) }),

  listSamples: (): Promise<{ items: FiberSample[]; total: number; filter: FilterState }> =>
    request('/samples'),

  getAllSamples: (): Promise<{ samples: FiberSample[] }> =>
    request('/samples/all'),

  getSample: (id: string): Promise<{ sample: FiberSample }> =>
    request(`/samples/${id}`),

  getConflictGroup: (id: string): Promise<{ group: FiberSample[] }> =>
    request(`/samples/${id}/conflict-group`),

  changeStatus: (id: string, status: FiberStatus, note: string, operatorName?: string, operatorId?: string): Promise<{ sample: FiberSample }> =>
    request(`/samples/${id}/status`, { method: 'POST', body: JSON.stringify({ status, note, operatorName, operatorId }) }),

  judge: (id: string, conclusion: 'PASS' | 'FAIL' | 'CONFLICT', remark: string, by?: string): Promise<{ sample: FiberSample }> =>
    request(`/samples/${id}/judge`, { method: 'POST', body: JSON.stringify({ conclusion, remark, by }) }),

  addDrying: (id: string, rec: Omit<DryingRecord, 'id' | 'moistureContent' | 'recordedAt'>): Promise<{ sample: FiberSample }> =>
    request(`/samples/${id}/drying`, { method: 'POST', body: JSON.stringify(rec) }),

  addPhoto: (id: string, photo: Omit<MicroPhoto, 'id' | 'capturedAt'>): Promise<{ sample: FiberSample }> =>
    request(`/samples/${id}/photo`, { method: 'POST', body: JSON.stringify(photo) }),

  getFilter: (): Promise<{ filter: FilterState }> =>
    request('/filter'),

  saveFilter: (filter: Partial<FilterState>): Promise<{ filter: FilterState }> =>
    request('/filter', { method: 'POST', body: JSON.stringify(filter) }),

  getActiveDetail: (): Promise<{ id: string | null }> =>
    request('/active-detail'),

  saveActiveDetail: (id: string | null): Promise<{ id: string | null }> =>
    request('/active-detail', { method: 'POST', body: JSON.stringify({ id }) }),

  exportPreview: (): Promise<{ rows: any[]; count: number }> =>
    request('/export'),

  reset: (): Promise<{ samples: FiberSample[]; count: number }> =>
    request('/reset', { method: 'POST' }),
}
