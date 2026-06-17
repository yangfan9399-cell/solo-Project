import { getDb, saveDb } from './db';
import { generateId, now } from './utils';
import type { VersionHistory, PaginationParams, PaginatedResult } from '../types';

export function addVersionHistory(
  projectId: string,
  entityType: VersionHistory['entityType'],
  entityId: string,
  action: VersionHistory['action'],
  changes: Record<string, { old: unknown; new: unknown }>,
  userId: string,
  userName: string,
  description: string,
  batchId?: string
): VersionHistory {
  const db = getDb();
  const id = generateId();
  const timestamp = now();
  
  const version: VersionHistory = {
    id,
    projectId,
    entityType,
    entityId,
    action,
    changes,
    userId,
    userName,
    timestamp,
    batchId: batchId || null,
    description
  };
  
  db.versionHistory.push(version);
  saveDb(db);
  
  return version;
}

export function getVersionById(id: string): VersionHistory | null {
  const db = getDb();
  return db.versionHistory.find(v => v.id === id) || null;
}

export function listVersionHistory(
  projectId: string,
  params: PaginationParams & { entityType?: string; entityId?: string; batchId?: string }
): PaginatedResult<VersionHistory> {
  const db = getDb();
  const { page, pageSize, sortBy = 'timestamp', sortOrder = 'desc', entityType, entityId, batchId } = params;
  
  let filtered = db.versionHistory.filter(v => v.projectId === projectId);
  
  if (entityType) {
    filtered = filtered.filter(v => v.entityType === entityType);
  }
  
  if (entityId) {
    filtered = filtered.filter(v => v.entityId === entityId);
  }
  
  if (batchId) {
    filtered = filtered.filter(v => v.batchId === batchId);
  }
  
  filtered = [...filtered].sort((a, b) => {
    const aVal = (a as any)[sortBy];
    const bVal = (b as any)[sortBy];
    if (sortOrder === 'asc') {
      return new Date(aVal).getTime() - new Date(bVal).getTime();
    }
    return new Date(bVal).getTime() - new Date(aVal).getTime();
  });
  
  const total = filtered.length;
  const offset = (page - 1) * pageSize;
  const items = filtered.slice(offset, offset + pageSize);
  
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export function getVersionByEntity(entityType: string, entityId: string): VersionHistory[] {
  const db = getDb();
  return db.versionHistory
    .filter(v => v.entityType === entityType && v.entityId === entityId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

type BatchInfo = { batchId: string; count: number; firstTimestamp: string; lastTimestamp: string };

export function getBatches(projectId: string): BatchInfo[] {
  const db = getDb();
  const batchMap = new Map<string, BatchInfo>();
  
  db.versionHistory
    .filter(v => v.projectId === projectId && v.batchId)
    .forEach(v => {
      const batchId = v.batchId!;
      const existing = batchMap.get(batchId);
      if (existing) {
        existing.count++;
        if (v.timestamp < existing.firstTimestamp) {
          existing.firstTimestamp = v.timestamp;
        }
        if (v.timestamp > existing.lastTimestamp) {
          existing.lastTimestamp = v.timestamp;
        }
      } else {
        batchMap.set(batchId, {
          batchId,
          count: 1,
          firstTimestamp: v.timestamp,
          lastTimestamp: v.timestamp
        } as BatchInfo);
      }
    });
  
  return Array.from(batchMap.values()).sort((a, b) => 
    new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
  );
}

export function createBatch(): string {
  return generateId();
}
