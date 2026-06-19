/**
 * ============================================================
 *  后端存储层 (Backend Persistence Layer)
 *  — 浏览器 localStorage 模拟的持久化后端 —
 *
 *  四大持久化域 (4 Persistent Domains):
 *   ① scheduling  - 排程域 (工单/备件/班组/筛选)
 *   ② approval    - 审批域 (审批记录 / 当前用户)
 *   ③ conflict    - 冲突域 (冲突快照 / 最近重算时间)
 *   ④ audit       - 审计域 (审计日志)
 *
 *  所有 UI 状态 (ui key) 也被持久化，确保刷新后
 *  筛选、选中、展开等用户操作痕迹完整保留。
 * ============================================================
 */

const VERSION = 1;
const PREFIX = `wg_scheduler_v${VERSION}_`;

export const STORAGE_KEYS = {
  /* ① 排程域 scheduling */
  workOrders: `${PREFIX}domain__scheduling__workOrders`,
  partBatches: `${PREFIX}domain__scheduling__partBatches`,
  teams: `${PREFIX}domain__scheduling__teams`,
  filters: `${PREFIX}domain__scheduling__filters`,

  /* ② 审批域 approval */
  approvals: `${PREFIX}domain__approval__records`,
  currentUser: `${PREFIX}domain__approval__currentUser`,

  /* ③ 冲突域 conflict */
  conflicts: `${PREFIX}domain__conflict__snapshot`,
  lastConflictRecalc: `${PREFIX}domain__conflict__lastRecalcAt`,

  /* ④ 审计域 audit */
  auditLogs: `${PREFIX}domain__audit__logs`,

  /* UI 状态 */
  ui: `${PREFIX}ui__state`,

  /* 初始化标记 */
  initialized: `${PREFIX}__system__initialized`,
} as const;

/* ================= 核心读写 ================= */

export function saveToStorage<T>(key: string, value: T): void {
  try {
    const payload = JSON.stringify(value);
    localStorage.setItem(key, payload);
  } catch (e) {
    console.error('[BackendStorage] 写入失败 >>', key, e);
  }
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error('[BackendStorage] 读取失败 >>', key, e);
    return fallback;
  }
}

/* ================= 元操作 ================= */

export function isInitialized(): boolean {
  return loadFromStorage<boolean>(STORAGE_KEYS.initialized, false);
}

export function markInitialized(): void {
  saveToStorage(STORAGE_KEYS.initialized, true);
}

export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}

/* ================= 冲突快照辅助 =================
 *  — 确保刷新后冲突 ID、排序结果保持稳定 — */
export interface ConflictSnapshotMeta {
  generatedAt: string;
  seed: string;
  count: number;
}

export function saveConflictSnapshot(conflicts: unknown[]): void {
  const meta: ConflictSnapshotMeta = {
    generatedAt: new Date().toISOString(),
    seed: `seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    count: Array.isArray(conflicts) ? conflicts.length : 0,
  };
  saveToStorage(STORAGE_KEYS.conflicts, { meta, data: conflicts });
  saveToStorage(STORAGE_KEYS.lastConflictRecalc, meta.generatedAt);
}

export function loadConflictSnapshot<T>(fallback: T): T {
  const wrapped = loadFromStorage<{ meta: ConflictSnapshotMeta; data: T } | null>(
    STORAGE_KEYS.conflicts,
    null,
  );
  return wrapped ? wrapped.data : fallback;
}

/* ================= 审计辅助 ================= */

export function recordStorageAudit(action: string, key: string, extra?: Record<string, unknown>): void {
  const trail = loadFromStorage<Array<{ at: string; action: string; key: string; extra?: Record<string, unknown> }>>(
    `${PREFIX}__storage_audit_trail`,
    [],
  );
  trail.unshift({
    at: new Date().toISOString(),
    action,
    key,
    extra,
  });
  // 最多保留 200 条存储级操作轨迹
  saveToStorage(`${PREFIX}__storage_audit_trail`, trail.slice(0, 200));
}
