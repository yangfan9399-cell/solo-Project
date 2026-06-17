import { getDb, saveDb } from './db';
import { generateId, now } from './utils';
import type { StratigraphicRelation } from '../types';

export function createRelation(data: Omit<StratigraphicRelation, 'id' | 'createdAt'>): StratigraphicRelation {
  const db = getDb();
  const id = generateId();
  const timestamp = now();
  
  const relation: StratigraphicRelation = {
    id,
    ...data,
    createdAt: timestamp
  };
  
  db.relations.push(relation);
  saveDb(db);
  
  return relation;
}

export function getRelationById(id: string): StratigraphicRelation | null {
  const db = getDb();
  return db.relations.find(r => r.id === id) || null;
}

export function getRelationsByProject(projectId: string): StratigraphicRelation[] {
  const db = getDb();
  return db.relations.filter(r => r.projectId === projectId);
}

export function getRelationsByUnit(unitId: string): StratigraphicRelation[] {
  const db = getDb();
  return db.relations.filter(r => r.fromUnitId === unitId || r.toUnitId === unitId);
}

export function updateRelation(id: string, data: Partial<StratigraphicRelation>): StratigraphicRelation | null {
  const db = getDb();
  const index = db.relations.findIndex(r => r.id === id);
  
  if (index === -1) return null;
  
  const existing = db.relations[index];
  const updated: StratigraphicRelation = {
    ...existing,
    ...data
  };
  
  db.relations[index] = updated;
  saveDb(db);
  
  return updated;
}

export function deleteRelation(id: string): boolean {
  const db = getDb();
  const index = db.relations.findIndex(r => r.id === id);
  
  if (index === -1) return false;
  
  db.relations.splice(index, 1);
  saveDb(db);
  
  return true;
}

export function createBidirectionalRelation(
  projectId: string,
  unitAId: string,
  unitBId: string,
  relationType: StratigraphicRelation['relationType'],
  notes?: string,
  confirmed?: boolean,
  createdBy?: string
): StratigraphicRelation[] {
  const reverseMap: Record<string, StratigraphicRelation['relationType']> = {
    'above': 'below',
    'below': 'above',
    'cut': 'fills',
    'fills': 'cut',
    'equal': 'equal',
    'contemporary': 'contemporary'
  };
  
  const forward = createRelation({
    projectId,
    fromUnitId: unitAId,
    toUnitId: unitBId,
    relationType,
    confirmed: confirmed ?? true,
    notes: notes ?? ''
  });
  
  const reverse = createRelation({
    projectId,
    fromUnitId: unitBId,
    toUnitId: unitAId,
    relationType: reverseMap[relationType],
    confirmed: true,
    notes: ''
  });
  
  return [forward, reverse];
}
