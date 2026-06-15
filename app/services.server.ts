import { loadDb, saveDb, generateId, now } from './db.server';
import type {
  MasterRecord,
  DetailRecord,
  HistoryRecord,
  ResultRecord,
  ContourPoint,
  PointLabel,
  ErrorNote,
  LayerEdit,
} from './types';

export const masterService = {
  getAll(): MasterRecord[] {
    const db = loadDb();
    return db.masters
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(mapMaster);
  },

  getById(id: string): MasterRecord | null {
    const db = loadDb();
    const row = db.masters.find(m => m.id === id);
    return row ? mapMaster(row) : null;
  },

  create(data: Partial<MasterRecord> & { mapImageData: string; name: string; mapWidth: number; mapHeight: number }): MasterRecord {
    const db = loadDb();
    const id = generateId();
    const createdAt = now();
    const batchNo = `BATCH-${Date.now().toString().slice(-8)}`;
    
    const master: any = {
      id,
      name: data.name,
      description: data.description || '',
      mapImageData: data.mapImageData,
      mapWidth: data.mapWidth,
      mapHeight: data.mapHeight,
      scaleBarLength: data.scaleBarLength || 0,
      scaleBarRealDistance: data.scaleBarRealDistance || 0,
      scaleUnit: data.scaleUnit || 'm',
      createdAt,
      updatedAt: createdAt,
      status: data.status || 'draft',
      version: 1,
      batchNo,
    };
    
    db.masters.push(master);
    saveDb(db);
    return mapMaster(master);
  },

  update(id: string, data: Partial<MasterRecord>): MasterRecord | null {
    const db = loadDb();
    const idx = db.masters.findIndex(m => m.id === id);
    if (idx === -1) return null;
    
    const existing = db.masters[idx];
    const updated = {
      ...existing,
      ...data,
      updatedAt: now(),
      version: existing.version + 1,
    };
    
    db.masters[idx] = updated;
    saveDb(db);
    return mapMaster(updated);
  },

  setScale(id: string, scaleBarLength: number, scaleBarRealDistance: number, scaleUnit: string): MasterRecord | null {
    return this.update(id, {
      scaleBarLength,
      scaleBarRealDistance,
      scaleUnit,
      status: 'scaled',
    });
  },
};

export const detailService = {
  getByMasterId(masterId: string): DetailRecord[] {
    const db = loadDb();
    return db.details
      .filter(d => d.masterId === masterId)
      .sort((a, b) => a.contourElevation - b.contourElevation)
      .map(mapDetail);
  },

  getById(id: string): DetailRecord | null {
    const db = loadDb();
    const row = db.details.find(d => d.id === id);
    return row ? mapDetail(row) : null;
  },

  create(data: Partial<DetailRecord> & { masterId: string; contourElevation: number; contourPoints: ContourPoint[]; layerName: string }): DetailRecord {
    const db = loadDb();
    const id = generateId();
    const createdAt = now();
    
    const detail: any = {
      id,
      masterId: data.masterId,
      contourElevation: data.contourElevation,
      contourPoints: data.contourPoints,
      color: data.color || '#3b82f6',
      lineWidth: data.lineWidth || 2,
      layerName: data.layerName,
      isVisible: data.isVisible !== false,
      createdAt,
      version: 1,
    };
    
    db.details.push(detail);
    saveDb(db);
    return mapDetail(detail);
  },

  update(id: string, data: Partial<DetailRecord>): DetailRecord | null {
    const db = loadDb();
    const idx = db.details.findIndex(d => d.id === id);
    if (idx === -1) return null;
    
    const existing = db.details[idx];
    const updated = {
      ...existing,
      ...data,
      version: existing.version + 1,
    };
    
    if (data.contourPoints) {
      updated.contourPoints = data.contourPoints;
    }
    
    db.details[idx] = updated;
    saveDb(db);
    return mapDetail(updated);
  },

  delete(id: string): boolean {
    const db = loadDb();
    const idx = db.details.findIndex(d => d.id === id);
    if (idx === -1) return false;
    db.details.splice(idx, 1);
    saveDb(db);
    return true;
  },

  toggleVisibility(id: string, isVisible: boolean): DetailRecord | null {
    return this.update(id, { isVisible });
  },
};

export const historyService = {
  getByMasterId(masterId: string): HistoryRecord[] {
    const db = loadDb();
    return db.histories
      .filter(h => h.masterId === masterId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(mapHistory);
  },

  getById(id: string): HistoryRecord | null {
    const db = loadDb();
    const row = db.histories.find(h => h.id === id);
    return row ? mapHistory(row) : null;
  },

  create(data: Partial<HistoryRecord> & { masterId: string; type: string; name: string; data: any }): HistoryRecord {
    const db = loadDb();
    const id = generateId();
    const createdAt = now();
    
    const history: any = {
      id,
      masterId: data.masterId,
      type: data.type,
      name: data.name,
      data: data.data,
      createdAt,
      operator: data.operator || 'system',
      remark: data.remark || '',
      version: 1,
    };
    
    db.histories.push(history);
    saveDb(db);
    return mapHistory(history);
  },
};

export const resultService = {
  getByMasterId(masterId: string): ResultRecord | null {
    const db = loadDb();
    const row = db.results.find(r => r.masterId === masterId);
    return row ? mapResult(row) : null;
  },

  create(masterId: string): ResultRecord {
    const db = loadDb();
    const id = generateId();
    const createdAt = now();
    
    const result: any = {
      id,
      masterId,
      layerEdits: [],
      pointLabels: [],
      errorNotes: [],
      exportImageUrl: null,
      exportAt: null,
      createdAt,
      updatedAt: createdAt,
      version: 1,
      status: 'editing',
    };
    
    db.results.push(result);
    saveDb(db);
    return mapResult(result);
  },

  getOrCreate(masterId: string): ResultRecord {
    const existing = this.getByMasterId(masterId);
    if (existing) return existing;
    return this.create(masterId);
  },

  addLayerEdit(masterId: string, edit: Omit<LayerEdit, 'id' | 'timestamp'>): ResultRecord | null {
    const db = loadDb();
    let result = db.results.find(r => r.masterId === masterId);
    if (!result) {
      const newResult = this.create(masterId);
      result = db.results.find(r => r.id === newResult.id)!;
    }
    
    result.layerEdits.push({
      id: generateId(),
      timestamp: now(),
      ...edit,
    });
    result.version = result.version + 1;
    result.updatedAt = now();
    
    saveDb(db);
    return mapResult(result);
  },

  addPointLabel(masterId: string, label: Omit<PointLabel, 'id'>): ResultRecord | null {
    const db = loadDb();
    let result = db.results.find(r => r.masterId === masterId);
    if (!result) {
      const newResult = this.create(masterId);
      result = db.results.find(r => r.id === newResult.id)!;
    }
    
    result.pointLabels.push({
      id: generateId(),
      ...label,
    });
    result.version = result.version + 1;
    result.updatedAt = now();
    
    saveDb(db);
    return mapResult(result);
  },

  removePointLabel(masterId: string, labelId: string): ResultRecord | null {
    const db = loadDb();
    const result = db.results.find(r => r.masterId === masterId);
    if (!result) return null;
    
    result.pointLabels = result.pointLabels.filter((l: any) => l.id !== labelId);
    result.version = result.version + 1;
    result.updatedAt = now();
    
    saveDb(db);
    return mapResult(result);
  },

  addErrorNote(masterId: string, note: Omit<ErrorNote, 'id' | 'createdAt' | 'resolved'>): ResultRecord | null {
    const db = loadDb();
    let result = db.results.find(r => r.masterId === masterId);
    if (!result) {
      const newResult = this.create(masterId);
      result = db.results.find(r => r.id === newResult.id)!;
    }
    
    result.errorNotes.push({
      id: generateId(),
      createdAt: now(),
      resolved: false,
      ...note,
    });
    result.status = 'editing';
    result.version = result.version + 1;
    result.updatedAt = now();
    
    saveDb(db);
    return mapResult(result);
  },

  resolveErrorNote(masterId: string, noteId: string, resolved: boolean): ResultRecord | null {
    const db = loadDb();
    const result = db.results.find(r => r.masterId === masterId);
    if (!result) return null;
    
    const note = result.errorNotes.find((n: any) => n.id === noteId);
    if (note) {
      note.resolved = resolved;
      result.version = result.version + 1;
      result.updatedAt = now();
      saveDb(db);
    }
    
    return mapResult(result);
  },

  setExported(masterId: string, exportImageUrl: string): ResultRecord | null {
    const db = loadDb();
    let result = db.results.find(r => r.masterId === masterId);
    if (!result) {
      const newResult = this.create(masterId);
      result = db.results.find(r => r.id === newResult.id)!;
    }
    
    result.exportImageUrl = exportImageUrl;
    result.exportAt = now();
    result.status = 'exported';
    result.version = result.version + 1;
    result.updatedAt = now();
    
    saveDb(db);
    return mapResult(result);
  },

  setStatus(masterId: string, status: ResultRecord['status']): ResultRecord | null {
    const db = loadDb();
    let result = db.results.find(r => r.masterId === masterId);
    if (!result) {
      const newResult = this.create(masterId);
      result = db.results.find(r => r.id === newResult.id)!;
    }
    
    result.status = status;
    result.version = result.version + 1;
    result.updatedAt = now();
    
    saveDb(db);
    return mapResult(result);
  },
};

export function createSnapshot(masterId: string, remark?: string): string {
  const db = loadDb();
  const master = db.masters.find(m => m.id === masterId);
  if (!master) return '';
  
  const details = db.details.filter(d => d.masterId === masterId);
  const histories = db.histories.filter(h => h.masterId === masterId);
  const result = db.results.find(r => r.masterId === masterId);
  
  const snapshotData = {
    master: JSON.parse(JSON.stringify(master)),
    details: JSON.parse(JSON.stringify(details)),
    histories: JSON.parse(JSON.stringify(histories)),
    result: result ? JSON.parse(JSON.stringify(result)) : null,
  };
  
  const snapshot = {
    id: generateId(),
    masterId,
    version: master.version,
    snapshotData,
    createdAt: now(),
    remark: remark || '',
  };
  
  db.snapshots.push(snapshot);
  saveDb(db);
  
  return snapshot.id;
}

export function restoreFromSnapshot(snapshotId: string): boolean {
  const db = loadDb();
  const snapshot = db.snapshots.find(s => s.id === snapshotId);
  if (!snapshot) return false;
  
  const data = snapshot.snapshotData;
  const masterId = snapshot.masterId;
  
  db.details = db.details.filter(d => d.masterId !== masterId);
  db.histories = db.histories.filter(h => h.masterId !== masterId);
  db.results = db.results.filter(r => r.masterId !== masterId);
  
  if (data.details) {
    db.details.push(...data.details);
  }
  if (data.histories) {
    db.histories.push(...data.histories);
  }
  if (data.result) {
    db.results.push(data.result);
  }
  if (data.master) {
    const masterIdx = db.masters.findIndex(m => m.id === masterId);
    if (masterIdx !== -1) {
      db.masters[masterIdx] = { ...data.master, updatedAt: now(), version: db.masters[masterIdx].version + 1 };
    }
  }
  
  saveDb(db);
  return true;
}

export function getSnapshotsByMasterId(masterId: string): any[] {
  const db = loadDb();
  return db.snapshots
    .filter(s => s.masterId === masterId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function mapMaster(row: any): MasterRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    mapImageData: row.mapImageData,
    mapWidth: row.mapWidth,
    mapHeight: row.mapHeight,
    scaleBarLength: row.scaleBarLength,
    scaleBarRealDistance: row.scaleBarRealDistance,
    scaleUnit: row.scaleUnit,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    status: row.status as MasterRecord['status'],
    version: row.version,
    batchNo: row.batchNo,
  };
}

function mapDetail(row: any): DetailRecord {
  return {
    id: row.id,
    masterId: row.masterId,
    contourElevation: row.contourElevation,
    contourPoints: Array.isArray(row.contourPoints) ? row.contourPoints : JSON.parse(row.contourPoints || '[]'),
    color: row.color,
    lineWidth: row.lineWidth,
    layerName: row.layerName,
    isVisible: row.isVisible === true || row.isVisible === 1,
    createdAt: row.createdAt,
    version: row.version,
  };
}

function mapHistory(row: any): HistoryRecord {
  return {
    id: row.id,
    masterId: row.masterId,
    type: row.type as HistoryRecord['type'],
    name: row.name,
    data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
    createdAt: row.createdAt,
    operator: row.operator,
    remark: row.remark,
    version: row.version,
  };
}

function mapResult(row: any): ResultRecord {
  return {
    id: row.id,
    masterId: row.masterId,
    layerEdits: Array.isArray(row.layerEdits) ? row.layerEdits : JSON.parse(row.layerEdits || '[]'),
    pointLabels: Array.isArray(row.pointLabels) ? row.pointLabels : JSON.parse(row.pointLabels || '[]'),
    errorNotes: Array.isArray(row.errorNotes) ? row.errorNotes : JSON.parse(row.errorNotes || '[]'),
    exportImageUrl: row.exportImageUrl,
    exportAt: row.exportAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    version: row.version,
    status: row.status as ResultRecord['status'],
  };
}
