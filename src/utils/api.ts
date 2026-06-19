// 后端 API 封装 - 四大域：scheduling / approval / conflict / audit
// Base URL 通过 Vite 代理：/api -> http://localhost:3001

const API_BASE = '/api';

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API ${options.method || 'GET'} ${url} failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ============ 状态全景 ============
export interface FullState {
  workOrders: any[];
  partBatches: any[];
  teams: any[];
  approvals: any[];
  auditLogs: any[];
  conflicts: any[];
  lastConflictRecalc: string | null;
  filters: Record<string, any>;
  ui: Record<string, any>;
  currentUser: { name: string; role: string };
  initialized: boolean;
}

export async function fetchFullState(): Promise<FullState> {
  return request<FullState>('/state');
}

export async function updateDomain(domain: string, data: any): Promise<any> {
  return request(`/state/domain/${encodeURIComponent(domain)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============ 排程域：工单 ============
export async function fetchWorkOrders() {
  return request<any[]>('/work-orders');
}

export async function createWorkOrder(data: any) {
  return request<any>('/work-orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateWorkOrder(id: string, patch: any) {
  return request<any>(`/work-orders/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}

export async function deleteWorkOrder(id: string) {
  return request(`/work-orders/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ============ 审批域 ============
export async function fetchApprovals() {
  return request<any[]>('/approvals');
}

export async function createApproval(record: any) {
  return request<any>('/approvals', {
    method: 'POST',
    body: JSON.stringify(record),
  });
}

// ============ 冲突域 ============
export interface ConflictSnapshot {
  conflicts: any[];
  lastRecalc: string | null;
}

export async function fetchConflicts(): Promise<ConflictSnapshot> {
  return request<ConflictSnapshot>('/conflicts');
}

export async function saveConflictSnapshot(conflicts: any[]) {
  return request('/conflicts', {
    method: 'PUT',
    body: JSON.stringify({ conflicts }),
  });
}

export async function loadConflictSnapshot<T>(fallback: T): Promise<T> {
  try {
    const snap = await fetchConflicts();
    return (snap.conflicts as unknown as T) || fallback;
  } catch {
    return fallback;
  }
}

// ============ 审计域 ============
export async function fetchAuditLogs(limit = 200) {
  return request<any[]>(`/audit-logs?limit=${limit}`);
}

export async function createAuditLog(log: any) {
  return request<any>('/audit-logs', {
    method: 'POST',
    body: JSON.stringify(log),
  });
}

// ============ 筛选 & UI & 用户 ============
export async function fetchFilters() {
  return request<Record<string, any>>('/filters');
}

export async function updateFilters(filters: any) {
  return request<any>('/filters', {
    method: 'PUT',
    body: JSON.stringify(filters),
  });
}

export async function clearFilters() {
  return request('/filters', { method: 'DELETE' });
}

export async function fetchUI() {
  return request<Record<string, any>>('/ui');
}

export async function updateUI(ui: any) {
  return request<any>('/ui', {
    method: 'PUT',
    body: JSON.stringify(ui),
  });
}

export async function fetchCurrentUser() {
  return request<{ name: string; role: string }>('/current-user');
}

// ============ 重置 ============
export async function resetAllData() {
  return request('/reset', { method: 'POST' });
}

// ============ 健康检查 ============
export async function healthCheck() {
  return request<{ status: string; timestamp: string }>('/health');
}
