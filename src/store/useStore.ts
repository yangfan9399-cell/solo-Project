import { create } from 'zustand'
import type { Anomaly, RetestRecord, ThresholdRule, StatusTransition, CloseAudit } from '@/types'

interface AppState {
  anomalies: Anomaly[]
  currentAnomaly: Anomaly | null
  retestRecords: RetestRecord[]
  rules: ThresholdRule[]
  transitions: StatusTransition[]
  audits: CloseAudit[]
  loading: boolean
  error: string | null

  fetchAnomalies: (filters?: { status?: string; search?: string; sort?: string; order?: string }) => Promise<void>
  fetchAnomaly: (id: string) => Promise<void>
  createAnomaly: (data: any) => Promise<void>
  updateAnomaly: (id: string, data: any) => Promise<void>
  closeAnomaly: (id: string, data: { closedType: string; closedReason: string; operator: string }) => Promise<void>
  reviewAnomaly: (id: string, data: { reviewOpinion: string; approved: boolean; operator: string }) => Promise<void>
  fetchRetestRecords: (anomalyId: string) => Promise<void>
  createRetest: (data: any) => Promise<void>
  fetchRules: () => Promise<void>
  createRule: (data: any) => Promise<void>
  updateRule: (id: string, data: any) => Promise<void>
  fetchRuleVersions: (id: string) => Promise<ThresholdRule[]>
  fetchTransitions: (anomalyId: string) => Promise<void>
  fetchAudits: (anomalyId: string) => Promise<void>
  seedData: () => Promise<void>
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) {
    throw new Error(json.error || '请求失败')
  }
  return json.data as T
}

export const useStore = create<AppState>((set, get) => ({
  anomalies: [],
  currentAnomaly: null,
  retestRecords: [],
  rules: [],
  transitions: [],
  audits: [],
  loading: false,
  error: null,

  fetchAnomalies: async (filters) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.set('status', filters.status)
      if (filters?.search) params.set('search', filters.search)
      if (filters?.sort) params.set('sort', filters.sort)
      if (filters?.order) params.set('order', filters.order)
      const qs = params.toString()
      const url = `/api/anomalies${qs ? `?${qs}` : ''}`
      const data = await api<Anomaly[]>(url)
      set({ anomalies: data, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  fetchAnomaly: async (id) => {
    set({ loading: true, error: null })
    try {
      const data = await api<Anomaly>(`/api/anomalies/${id}`)
      set({ currentAnomaly: data, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  createAnomaly: async (data) => {
    set({ loading: true, error: null })
    try {
      await api<Anomaly>('/api/anomalies', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      await get().fetchAnomalies()
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  updateAnomaly: async (id, data) => {
    set({ loading: true, error: null })
    try {
      await api<Anomaly>(`/api/anomalies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      await get().fetchAnomalies()
      if (get().currentAnomaly?.id === id) {
        await get().fetchAnomaly(id)
      }
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  closeAnomaly: async (id, data) => {
    set({ loading: true, error: null })
    try {
      await api<Anomaly>(`/api/anomalies/${id}/close`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      await get().fetchAnomalies()
      if (get().currentAnomaly?.id === id) {
        await get().fetchAnomaly(id)
      }
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  reviewAnomaly: async (id, data) => {
    set({ loading: true, error: null })
    try {
      await api<Anomaly>(`/api/anomalies/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      await get().fetchAnomalies()
      if (get().currentAnomaly?.id === id) {
        await get().fetchAnomaly(id)
      }
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  fetchRetestRecords: async (anomalyId) => {
    set({ loading: true, error: null })
    try {
      const data = await api<RetestRecord[]>(`/api/retests/${anomalyId}`)
      set({ retestRecords: data, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  createRetest: async (data) => {
    set({ loading: true, error: null })
    try {
      await api<RetestRecord>('/api/retests', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      await get().fetchRetestRecords(data.anomalyId)
      await get().fetchAnomalies()
      if (get().currentAnomaly?.id === data.anomalyId) {
        await get().fetchAnomaly(data.anomalyId)
      }
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  fetchRules: async () => {
    set({ loading: true, error: null })
    try {
      const data = await api<ThresholdRule[]>('/api/rules')
      set({ rules: data, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  createRule: async (data) => {
    set({ loading: true, error: null })
    try {
      await api<ThresholdRule>('/api/rules', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      await get().fetchRules()
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  updateRule: async (id, data) => {
    set({ loading: true, error: null })
    try {
      await api<ThresholdRule>(`/api/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      await get().fetchRules()
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  fetchRuleVersions: async (id) => {
    const data = await api<ThresholdRule[]>(`/api/rules/${id}/versions`)
    return data
  },

  fetchTransitions: async (anomalyId) => {
    set({ loading: true, error: null })
    try {
      const data = await api<StatusTransition[]>(`/api/transitions/${anomalyId}`)
      set({ transitions: data, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  fetchAudits: async (anomalyId) => {
    set({ loading: true, error: null })
    try {
      const data = await api<CloseAudit[]>(`/api/audits/${anomalyId}`)
      set({ audits: data, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  seedData: async () => {
    set({ loading: true, error: null })
    try {
      await api<any>('/api/seed/seed', { method: 'POST' })
      await get().fetchAnomalies()
      await get().fetchRules()
      set({ loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
}))
