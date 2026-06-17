import { getDb, saveDb } from './db';
import { generateId, now } from './utils';
import { addVersionHistory } from './versionHistory';
import type { StratigraphicUnit, PaginationParams, PaginatedResult } from '../types';

export function createUnit(data: Omit<StratigraphicUnit, 'id' | 'createdAt' | 'updatedAt'>): StratigraphicUnit {
  const db = getDb();
  const id = generateId();
  const timestamp = now();
  
  const thickness = data.thickness || (data.depthBottom - data.depthTop);
  
  const unit: StratigraphicUnit = {
    id,
    ...data,
    thickness,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  db.units.push(unit);
  saveDb(db);
  
  addVersionHistory(data.projectId, 'unit', id, 'create', {}, 'system', '系统', `创建层位单元 ${data.unitNumber}`);
  
  return unit;
}

export function getUnitById(id: string): StratigraphicUnit | null {
  const db = getDb();
  return db.units.find(u => u.id === id) || null;
}

export function getUnitByNumber(projectId: string, unitNumber: string): StratigraphicUnit | null {
  const db = getDb();
  return db.units.find(u => u.projectId === projectId && u.unitNumber === unitNumber) || null;
}

export function listUnits(
  projectId: string,
  params: PaginationParams & { type?: string; search?: string }
): PaginatedResult<StratigraphicUnit> {
  const db = getDb();
  const { page, pageSize, sortBy = 'unitNumber', sortOrder = 'asc', type, search } = params;
  
  let filtered = db.units.filter(u => u.projectId === projectId);
  
  if (type) {
    filtered = filtered.filter(u => u.type === type);
  }
  
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(u => 
      u.unitNumber.toLowerCase().includes(q) || 
      (u.designation && u.designation.toLowerCase().includes(q)) ||
      (u.description && u.description.toLowerCase().includes(q))
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
  const items = filtered.slice(offset, offset + pageSize);
  
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export function getAllUnits(projectId: string): StratigraphicUnit[] {
  const db = getDb();
  return db.units
    .filter(u => u.projectId === projectId)
    .sort((a, b) => a.depthTop - b.depthTop);
}

export function updateUnit(id: string, data: Partial<StratigraphicUnit>): StratigraphicUnit | null {
  const db = getDb();
  const index = db.units.findIndex(u => u.id === id);
  
  if (index === -1) return null;
  
  const existing = db.units[index];
  const updated: StratigraphicUnit = {
    ...existing,
    ...data,
    updatedAt: now()
  };
  
  if (data.depthTop !== undefined || data.depthBottom !== undefined) {
    updated.thickness = updated.depthBottom - updated.depthTop;
  }
  
  db.units[index] = updated;
  saveDb(db);
  
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const key of Object.keys(data)) {
    if (!['id', 'projectId', 'createdAt', 'updatedAt'].includes(key)) {
      const oldVal = (existing as any)[key];
      const newVal = (updated as any)[key];
      if (oldVal !== newVal) {
        changes[key] = { old: oldVal, new: newVal };
      }
    }
  }
  
  if (Object.keys(changes).length > 0) {
    addVersionHistory(existing.projectId, 'unit', id, 'update', changes, 'system', '系统', `更新层位单元 ${existing.unitNumber}`);
  }
  
  return updated;
}

export function deleteUnit(id: string): boolean {
  const db = getDb();
  const unit = db.units.find(u => u.id === id);
  
  if (!unit) return false;
  
  db.units = db.units.filter(u => u.id !== id);
  db.relations = db.relations.filter(r => r.fromUnitId !== id && r.toUnitId !== id);
  db.artifacts = db.artifacts.filter(a => a.unitId !== id);
  db.photos = db.photos.map(p => p.unitId === id ? { ...p, unitId: null } : p);
  
  saveDb(db);
  
  addVersionHistory(unit.projectId, 'unit', id, 'delete', {}, 'system', '系统', `删除层位单元 ${unit.unitNumber}`);
  
  return true;
}
