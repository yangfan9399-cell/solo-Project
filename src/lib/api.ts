import type {
  Batch,
  Reading,
  BatchDetail,
  Consultation,
  ConsultationPayload,
  Stats,
  BatchStatus,
} from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = (await res.json()) as { success: boolean; data?: T; error?: string };
  if (!data.success || !res.ok) {
    throw new Error(data.error || `请求失败: ${res.status}`);
  }
  return data.data as T;
}

export const api = {
  getBatches: (params?: { status?: BatchStatus | 'all'; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return request<Batch[]>(`/batches${qs ? `?${qs}` : ''}`);
  },

  getBatchDetail: (id: string) => request<BatchDetail>(`/batches/${id}`),

  createBatch: (data: { batch_no: string; plaque_name: string; old_transcription?: string }) =>
    request<{ id: string }>('/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitReading: (reading: Omit<Reading, 'id' | 'submitted_at'>) =>
    request<{
      id: string;
      status: BatchStatus;
      readings_count: number;
      supplement_conflict_with_old: boolean;
      old_transcription?: string;
    }>('/readings', {
      method: 'POST',
      body: JSON.stringify(reading),
    }),

  submitConsultation: (payload: ConsultationPayload) =>
    request<{ consultationId: string; finalStatus: BatchStatus }>('/consultations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getConsultations: (batchId: string) =>
    request<Consultation[]>(`/consultations/batch/${batchId}`),

  getStats: () => request<Stats>('/stats'),
};
