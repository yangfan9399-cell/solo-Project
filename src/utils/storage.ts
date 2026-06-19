const VERSION = 1;
const PREFIX = `wg_scheduler_v${VERSION}_`;

export const STORAGE_KEYS = {
  workOrders: `${PREFIX}workOrders`,
  partBatches: `${PREFIX}partBatches`,
  teams: `${PREFIX}teams`,
  approvals: `${PREFIX}approvals`,
  auditLogs: `${PREFIX}auditLogs`,
  filters: `${PREFIX}filters`,
  ui: `${PREFIX}ui`,
  currentUser: `${PREFIX}currentUser`,
  initialized: `${PREFIX}initialized`,
} as const;

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage save failed:', key, e);
  }
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error('Storage load failed:', key, e);
    return fallback;
  }
}

export function isInitialized(): boolean {
  return loadFromStorage<boolean>(STORAGE_KEYS.initialized, false);
}

export function markInitialized(): void {
  saveToStorage(STORAGE_KEYS.initialized, true);
}

export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}
