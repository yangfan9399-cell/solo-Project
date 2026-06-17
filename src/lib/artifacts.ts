import { getDb, saveDb } from './db';
import { generateId, now } from './utils';
import { addVersionHistory } from './versionHistory';
import type { Artifact, PaginationParams, PaginatedResult } from '../types';

export function createArtifact(data: Omit<Artifact, 'id' | 'createdAt' | 'updatedAt' | 'photos'>): Artifact {
  const db = getDb();
  const id = generateId();
  const timestamp = now();
  
  const artifact: Artifact = {
    id,
    ...data,
    photos: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  db.artifacts.push(artifact);
  saveDb(db);
  
  addVersionHistory(data.projectId, 'artifact', id, 'create', {}, 'system', '系统', `创建出土物 ${data.catalogNumber}`);
  
  return artifact;
}

export function getArtifactById(id: string): Artifact | null {
  const db = getDb();
  const artifact = db.artifacts.find(a => a.id === id);
  return artifact ? { ...artifact, photos: [] } : null;
}

export function listArtifacts(
  projectId: string,
  params: PaginationParams & { unitId?: string; type?: string; search?: string }
): PaginatedResult<Artifact> {
  const db = getDb();
  const { page, pageSize, sortBy = 'catalogNumber', sortOrder = 'asc', unitId, type, search } = params;
  
  let filtered = db.artifacts.filter(a => a.projectId === projectId);
  
  if (unitId) {
    filtered = filtered.filter(a => a.unitId === unitId);
  }
  
  if (type) {
    filtered = filtered.filter(a => a.type === type);
  }
  
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(a => 
      a.catalogNumber.toLowerCase().includes(q) || 
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.description && a.description.toLowerCase().includes(q))
    );
  }
  
  filtered = [...filtered].sort((a, b) => {
    const aVal = (a as any)[sortBy];
    const bVal = (b as any)[sortBy];
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });
  
  const total = filtered.length;
  const offset = (page - 1) * pageSize;
  const items = filtered.slice(offset, offset + pageSize).map(a => ({ ...a, photos: [] }));
  
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export function getArtifactsByUnit(unitId: string): Artifact[] {
  const db = getDb();
  return db.artifacts
    .filter(a => a.unitId === unitId)
    .map(a => ({ ...a, photos: [] }))
    .sort((a, b) => a.catalogNumber.localeCompare(b.catalogNumber));
}

export function updateArtifact(id: string, data: Partial<Artifact>): Artifact | null {
  const db = getDb();
  const index = db.artifacts.findIndex(a => a.id === id);
  
  if (index === -1) return null;
  
  const existing = db.artifacts[index];
  const updated: Artifact = {
    ...existing,
    ...data,
    updatedAt: now()
  };
  
  db.artifacts[index] = updated;
  saveDb(db);
  
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const key of Object.keys(data)) {
    if (!['id', 'projectId', 'createdAt', 'updatedAt', 'photos'].includes(key)) {
      const oldVal = (existing as any)[key];
      const newVal = (updated as any)[key];
      if (oldVal !== newVal) {
        changes[key] = { old: oldVal, new: newVal };
      }
    }
  }
  
  if (Object.keys(changes).length > 0) {
    addVersionHistory(existing.projectId, 'artifact', id, 'update', changes, 'system', '系统', `更新出土物 ${existing.catalogNumber}`);
  }
  
  return { ...updated, photos: [] };
}

export function deleteArtifact(id: string): boolean {
  const db = getDb();
  const artifact = db.artifacts.find(a => a.id === id);
  
  if (!artifact) return false;
  
  db.artifacts = db.artifacts.filter(a => a.id !== id);
  db.photos = db.photos.map(p => p.artifactId === id ? { ...p, artifactId: null } : p);
  
  saveDb(db);
  
  addVersionHistory(artifact.projectId, 'artifact', id, 'delete', {}, 'system', '系统', `删除出土物 ${artifact.catalogNumber}`);
  
  return true;
}
