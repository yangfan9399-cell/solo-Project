import type { ExceptionRecord, ProcessingHistory, ExceptionType, PaymentChannel, RecordStatus } from './types';

let exceptionRecords: ExceptionRecord[] = [];
let processingHistories: ProcessingHistory[] = [];
let initialized = false;

export function isInited(): boolean {
  return initialized;
}

export function initSchema(): void {
  if (initialized) return;
  initialized = true;
}

export function getAllExceptions(): ExceptionRecord[] {
  return [...exceptionRecords];
}

export function getExceptionById(id: string): ExceptionRecord | undefined {
  return exceptionRecords.find((r) => r.id === id);
}

export function getHistoriesByExceptionId(exceptionId: string): ProcessingHistory[] {
  return processingHistories.filter((h) => h.exception_id === exceptionId);
}

export function queryExceptions(filters: {
  type?: ExceptionType;
  channel?: PaymentChannel;
  status?: RecordStatus;
}): ExceptionRecord[] {
  let result = [...exceptionRecords];
  if (filters.type) result = result.filter((r) => r.exception_type === filters.type);
  if (filters.channel) result = result.filter((r) => r.payment_channel === filters.channel);
  if (filters.status) result = result.filter((r) => r.status === filters.status);
  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function insertException(record: ExceptionRecord): void {
  exceptionRecords.push(record);
}

export function insertHistory(history: ProcessingHistory): void {
  processingHistories.push(history);
}

export function updateException(id: string, updates: Partial<ExceptionRecord>): ExceptionRecord | undefined {
  const idx = exceptionRecords.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  exceptionRecords[idx] = { ...exceptionRecords[idx], ...updates };
  return exceptionRecords[idx];
}

export function getStats() {
  const totalRefund = exceptionRecords
    .filter((r) => r.refund_amount)
    .reduce((s, r) => s + (r.refund_amount || 0), 0);

  return {
    total: exceptionRecords.length,
    pendingCount: exceptionRecords.filter((r) => r.status === 'pending').length,
    processingCount: exceptionRecords.filter((r) => !['pending', 'completed'].includes(r.status)).length,
    completedCount: exceptionRecords.filter((r) => r.status === 'completed').length,
    totalRefund,
  };
}
