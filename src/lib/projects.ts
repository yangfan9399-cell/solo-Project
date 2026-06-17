import { getDb, saveDb } from './db';
import { generateId, now } from './utils';
import type { Project, PaginationParams, PaginatedResult } from '../types';
import { addVersionHistory } from './versionHistory';

export function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
  const db = getDb();
  const id = generateId();
  const timestamp = now();
  
  const project: Project = {
    id,
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  db.projects.push(project);
  saveDb(db);
  
  addVersionHistory(id, 'project', id, 'create', {}, 'system', '系统', '创建项目');
  
  return project;
}

export function getProjectById(id: string): Project | null {
  const db = getDb();
  return db.projects.find(p => p.id === id) || null;
}

export function getProjectByCode(code: string): Project | null {
  const db = getDb();
  return db.projects.find(p => p.code === code) || null;
}

export function listProjects(params: PaginationParams & { search?: string; status?: string }): PaginatedResult<Project> {
  const db = getDb();
  const { page, pageSize, sortBy = 'createdAt', sortOrder = 'desc', search, status } = params;
  
  let filtered = [...db.projects];
  
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.code.toLowerCase().includes(q) || 
      (p.location && p.location.toLowerCase().includes(q))
    );
  }
  
  if (status) {
    filtered = filtered.filter(p => p.status === status);
  }
  
  filtered.sort((a, b) => {
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

export function updateProject(id: string, data: Partial<Project>): Project | null {
  const db = getDb();
  const index = db.projects.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  const existing = db.projects[index];
  const updated: Project = {
    ...existing,
    ...data,
    updatedAt: now()
  };
  
  db.projects[index] = updated;
  saveDb(db);
  
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const key of Object.keys(data)) {
    if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
      const oldVal = (existing as any)[key];
      const newVal = (data as any)[key];
      if (oldVal !== newVal) {
        changes[key] = { old: oldVal, new: newVal };
      }
    }
  }
  
  if (Object.keys(changes).length > 0) {
    addVersionHistory(id, 'project', id, 'update', changes, 'system', '系统', '更新项目信息');
  }
  
  return updated;
}

export function deleteProject(id: string): boolean {
  const db = getDb();
  const index = db.projects.findIndex(p => p.id === id);
  
  if (index === -1) return false;
  
  db.projects.splice(index, 1);
  
  db.units = db.units.filter(u => u.projectId !== id);
  db.relations = db.relations.filter(r => r.projectId !== id);
  db.artifacts = db.artifacts.filter(a => a.projectId !== id);
  db.photos = db.photos.filter(p => p.projectId !== id);
  db.versionHistory = db.versionHistory.filter(v => v.projectId !== id);
  
  saveDb(db);
  return true;
}

export function getProjectStats(projectId: string) {
  const db = getDb();
  
  const unitCount = db.units.filter(u => u.projectId === projectId).length;
  const artifactCount = db.artifacts.filter(a => a.projectId === projectId).length;
  const photoCount = db.photos.filter(p => p.projectId === projectId).length;
  const relationCount = db.relations.filter(r => r.projectId === projectId).length;
  const layerCount = db.units.filter(u => u.projectId === projectId && u.type === 'layer').length;
  const featureCount = db.units.filter(u => u.projectId === projectId && u.type === 'feature').length;
  
  return {
    unitCount,
    artifactCount,
    photoCount,
    relationCount,
    layerCount,
    featureCount
  };
}
