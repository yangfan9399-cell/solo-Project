import path from 'node:path';
import fs from 'node:fs';
import type {
  MainRecord,
  ExposureDetail,
  WashHistory,
  ResultRecord,
  BatchPhoto,
  BatchRecord,
  BatchStatus,
  FailTag,
} from './types';

interface DataStore {
  mainRecords: MainRecord[];
  exposureDetails: ExposureDetail[];
  washHistories: WashHistory[];
  resultRecords: ResultRecord[];
  batchPhotos: BatchPhoto[];
  meta: { initializedAt: number; lastSavedAt: number };
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'cyanotype_records.json');

let cache: DataStore | null = null;
let saveTimer: any = null;

function ensureDbDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

function defaultStore(): DataStore {
  return {
    mainRecords: [], exposureDetails: [], washHistories: [],
    resultRecords: [], batchPhotos: [],
    meta: { initializedAt: Date.now(), lastSavedAt: Date.now() },
  };
}

export function loadDb(): DataStore {
  if (cache) return cache;
  ensureDbDir();
  if (fs.existsSync(DB_PATH)) {
    try {
      cache = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as DataStore;
      if (!cache.mainRecords) cache = defaultStore();
    } catch { cache = defaultStore(); }
  } else {
    cache = defaultStore();
    persist(true);
  }
  return cache!;
}

export function persist(immediate = false) {
  const db = loadDb();
  db.meta.lastSavedAt = Date.now();
  const doSave = () => {
    try {
      ensureDbDir();
      const tmp = DB_PATH + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
      fs.renameSync(tmp, DB_PATH);
    } catch (e) { console.error('DB save error', e); }
  };
  if (immediate) doSave();
  else {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(doSave, 80);
  }
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface CreateMainInput {
  batchNo?: string;
  parentId?: string | null;
  solutionARatio: number;
  solutionBRatio: number;
  solutionC_Ratio?: number | null;
  totalVolumeMl: number;
  paperType: string;
  paperWeightGsm: number;
  notes?: string;
  createdBy: string;
  rollbackFromId?: string | null;
  rollbackReason?: string | null;
}

export function createMainRecord(input: CreateMainInput): MainRecord {
  const db = loadDb();
  const now = Date.now();
  const id = generateId('main');
  let batchNo = input.batchNo;
  let version = 1;
  let parentId = input.parentId || null;

  if (input.rollbackFromId) {
    const prev = db.mainRecords.find(m => m.id === input.rollbackFromId);
    if (prev) { batchNo = prev.batchNo; version = prev.version; parentId = prev.id; }
  } else if (parentId) {
    const parent = db.mainRecords.find(m => m.id === parentId);
    if (parent) { batchNo = parent.batchNo; version = parent.version + 1; }
  }
  if (!batchNo) {
    const dt = new Date();
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const prefix = `CY-${y}${m}${d}-`;
    const seq = db.mainRecords.filter(r => r.batchNo.startsWith(prefix)).length + 1;
    batchNo = `${prefix}${String(seq).padStart(3, '0')}`;
  }

  const rec: MainRecord = {
    id, batchNo, version, parentId,
    solutionARatio: input.solutionARatio, solutionBRatio: input.solutionBRatio,
    solutionC_Ratio: input.solutionC_Ratio ?? null, totalVolumeMl: input.totalVolumeMl,
    paperType: input.paperType, paperWeightGsm: input.paperWeightGsm,
    notes: input.notes ?? null,
    createdBy: input.createdBy, createdAt: now, updatedAt: now,
    status: 'draft', isArchived: false, archiveReason: null, archivedAt: null,
    rollbackFromId: input.rollbackFromId ?? null, rollbackReason: input.rollbackReason ?? null,
  };
  db.mainRecords.push(rec);
  persist();
  return rec;
}

export function updateMainRecord(
  id: string,
  updates: Partial<Pick<MainRecord,
    'solutionARatio' | 'solutionBRatio' | 'solutionC_Ratio' | 'totalVolumeMl' |
    'paperType' | 'paperWeightGsm' | 'notes' | 'status'
  >>
): MainRecord | null {
  const db = loadDb();
  const idx = db.mainRecords.findIndex(m => m.id === id);
  if (idx < 0) return null;
  const r = db.mainRecords[idx];
  const merged = { ...r, ...updates, updatedAt: Date.now() };
  if (updates.notes !== undefined) merged.notes = updates.notes || null;
  db.mainRecords[idx] = merged;
  persist();
  return merged;
}

export function archiveMainRecord(id: string, reason: string): MainRecord | null {
  const db = loadDb();
  const idx = db.mainRecords.findIndex(m => m.id === id);
  if (idx < 0) return null;
  const now = Date.now();
  db.mainRecords[idx] = {
    ...db.mainRecords[idx], isArchived: true, archiveReason: reason,
    archivedAt: now, status: 'archived', updatedAt: now,
  };
  persist();
  return db.mainRecords[idx];
}

export function unarchiveMainRecord(id: string): MainRecord | null {
  const db = loadDb();
  const idx = db.mainRecords.findIndex(m => m.id === id);
  if (idx < 0) return null;
  const now = Date.now();
  db.mainRecords[idx] = {
    ...db.mainRecords[idx], isArchived: false, archiveReason: null,
    archivedAt: null, status: 'completed', updatedAt: now,
  };
  persist();
  return db.mainRecords[idx];
}

export function getMainRecord(id: string): MainRecord | null {
  return loadDb().mainRecords.find(m => m.id === id) ?? null;
}

export function listMainRecords(opts?: { includeArchived?: boolean; status?: BatchStatus }): MainRecord[] {
  const db = loadDb();
  let rows = db.mainRecords.slice();
  if (!opts?.includeArchived) rows = rows.filter(r => !r.isArchived);
  if (opts?.status) rows = rows.filter(r => r.status === opts.status);
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

export function getVersionChain(batchNo: string): MainRecord[] {
  return loadDb().mainRecords
    .filter(m => m.batchNo === batchNo)
    .sort((a, b) => a.version - b.version || a.createdAt - b.createdAt);
}

export function createExposureDetail(input: Omit<ExposureDetail, 'id' | 'createdAt'>): ExposureDetail {
  const db = loadDb();
  const now = Date.now();
  const rec: ExposureDetail = { ...input, id: generateId('exp'), createdAt: now };
  db.exposureDetails.push(rec);
  persist();
  return rec;
}

export function listExposureDetails(mainRecordId: string): ExposureDetail[] {
  return loadDb().exposureDetails
    .filter(e => e.mainRecordId === mainRecordId)
    .sort((a, b) => a.sheetNo - b.sheetNo);
}

export function deleteExposureDetail(id: string): void {
  const db = loadDb();
  const before = db.exposureDetails.length;
  db.exposureDetails = db.exposureDetails.filter(e => e.id !== id);
  if (db.exposureDetails.length !== before) persist();
}

export function createWashHistory(input: Omit<WashHistory, 'id' | 'createdAt'>): WashHistory {
  const db = loadDb();
  const now = Date.now();
  const rec: WashHistory = { ...input, id: generateId('wash'), createdAt: now };
  db.washHistories.push(rec);
  persist();
  return rec;
}

export function listWashHistories(mainRecordId: string): WashHistory[] {
  return loadDb().washHistories
    .filter(w => w.mainRecordId === mainRecordId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export function deleteWashHistory(id: string): void {
  const db = loadDb();
  const before = db.washHistories.length;
  db.washHistories = db.washHistories.filter(w => w.id !== id);
  if (db.washHistories.length !== before) persist();
}

export function createResultRecord(input: Omit<ResultRecord, 'id'>): ResultRecord {
  const db = loadDb();
  db.resultRecords = db.resultRecords.filter(r => r.mainRecordId !== input.mainRecordId);
  const rec: ResultRecord = { ...input, id: generateId('res') };
  db.resultRecords.push(rec);
  const m = getMainRecord(input.mainRecordId);
  if (m) updateMainRecord(input.mainRecordId, { status: input.isSuccess ? 'completed' : 'failed' });
  persist();
  return rec;
}

export function updateResultRecord(id: string, updates: Partial<Omit<ResultRecord, 'id' | 'mainRecordId'>>): ResultRecord | null {
  const db = loadDb();
  const idx = db.resultRecords.findIndex(r => r.id === id);
  if (idx < 0) return null;
  const existing = db.resultRecords[idx];
  const merged: ResultRecord = { ...existing, ...updates } as ResultRecord;
  if (updates.failTags) merged.failTags = [...updates.failTags];
  if (updates.isSuccess !== undefined) merged.isSuccess = !!updates.isSuccess;
  db.resultRecords[idx] = merged;
  const m = getMainRecord(merged.mainRecordId);
  if (m) updateMainRecord(merged.mainRecordId, { status: merged.isSuccess ? 'completed' : 'failed' });
  persist();
  return merged;
}

export function getResultRecord(id: string): ResultRecord | null {
  return loadDb().resultRecords.find(r => r.id === id) ?? null;
}

export function getResultRecordByMain(mainRecordId: string): ResultRecord | null {
  return loadDb().resultRecords.find(r => r.mainRecordId === mainRecordId) ?? null;
}

export function createPhoto(input: Omit<BatchPhoto, 'id' | 'createdAt'>): BatchPhoto {
  const db = loadDb();
  const rec: BatchPhoto = { ...input, id: generateId('photo'), createdAt: Date.now() };
  db.batchPhotos.push(rec);
  persist();
  return rec;
}

export function listPhotos(batchId: string): BatchPhoto[] {
  return loadDb().batchPhotos
    .filter(p => p.batchId === batchId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function deletePhoto(id: string): void {
  const db = loadDb();
  const before = db.batchPhotos.length;
  db.batchPhotos = db.batchPhotos.filter(p => p.id !== id);
  if (db.batchPhotos.length !== before) persist();
}

export function getFullBatch(id: string): BatchRecord | null {
  const main = getMainRecord(id);
  if (!main) return null;
  return {
    main,
    exposureDetails: listExposureDetails(id),
    washHistories: listWashHistories(id),
    result: getResultRecordByMain(id),
    photos: listPhotos(id),
  };
}

export function cloneBatchForRecalc(parentId: string, createdBy: string): MainRecord | null {
  const parent = getFullBatch(parentId);
  if (!parent) return null;
  const newMain = createMainRecord({
    parentId,
    solutionARatio: parent.main.solutionARatio,
    solutionBRatio: parent.main.solutionBRatio,
    solutionC_Ratio: parent.main.solutionC_Ratio,
    totalVolumeMl: parent.main.totalVolumeMl,
    paperType: parent.main.paperType,
    paperWeightGsm: parent.main.paperWeightGsm,
    notes: `[重算版本] ${parent.main.notes || ''}`,
    createdBy,
  });
  for (const exp of parent.exposureDetails) {
    createExposureDetail({
      mainRecordId: newMain.id, sheetNo: exp.sheetNo,
      uvIntensityMwCm2: exp.uvIntensityMwCm2,
      exposureMinutes: exp.exposureMinutes, exposureSeconds: exp.exposureSeconds,
      uvIndex: exp.uvIndex, lightSource: exp.lightSource, distanceCm: exp.distanceCm,
    });
  }
  for (const w of parent.washHistories) {
    createWashHistory({
      mainRecordId: newMain.id, orderIndex: w.orderIndex, stage: w.stage,
      durationMinutes: w.durationMinutes, durationSeconds: w.durationSeconds,
      waterTempC: w.waterTempC, phValue: w.phValue, agitationHz: w.agitationHz,
      operatorNote: `[继承自版本${parent.main.version}] ${w.operatorNote || ''}`,
    });
  }
  if (parent.result) {
    createResultRecord({
      mainRecordId: newMain.id,
      roomTempC: parent.result.roomTempC, humidityPct: parent.result.humidityPct,
      solutionTempC: parent.result.solutionTempC, dryingTempC: parent.result.dryingTempC,
      dryingMethod: parent.result.dryingMethod,
      visualGrade: parent.result.visualGrade, densityGrade: parent.result.densityGrade,
      contrastGrade: parent.result.contrastGrade, overallScore: parent.result.overallScore,
      failTags: [...parent.result.failTags], isSuccess: parent.result.isSuccess,
      evaluator: parent.result.evaluator,
      evaluationNote: `[重算继承] ${parent.result.evaluationNote || ''}`,
      evaluatedAt: Date.now(),
      recalculationCount: parent.result.recalculationCount + 1,
      lastRecalculatedAt: Date.now(),
      recalculationNote: `从批次 ${parent.main.batchNo} v${parent.main.version} 重算创建`,
    });
  }
  return getMainRecord(newMain.id);
}

export function rollbackToVersion(targetId: string, createdBy: string, reason: string): MainRecord | null {
  const target = getFullBatch(targetId);
  if (!target) return null;
  const newMain = createMainRecord({
    rollbackFromId: targetId,
    solutionARatio: target.main.solutionARatio,
    solutionBRatio: target.main.solutionBRatio,
    solutionC_Ratio: target.main.solutionC_Ratio,
    totalVolumeMl: target.main.totalVolumeMl,
    paperType: target.main.paperType,
    paperWeightGsm: target.main.paperWeightGsm,
    notes: `[回滚至 v${target.main.version}] ${reason} | ${target.main.notes || ''}`,
    createdBy, rollbackReason: reason,
  });
  for (const exp of target.exposureDetails) {
    createExposureDetail({
      mainRecordId: newMain.id, sheetNo: exp.sheetNo,
      uvIntensityMwCm2: exp.uvIntensityMwCm2,
      exposureMinutes: exp.exposureMinutes, exposureSeconds: exp.exposureSeconds,
      uvIndex: exp.uvIndex, lightSource: exp.lightSource, distanceCm: exp.distanceCm,
    });
  }
  for (const w of target.washHistories) {
    createWashHistory({
      mainRecordId: newMain.id, orderIndex: w.orderIndex, stage: w.stage,
      durationMinutes: w.durationMinutes, durationSeconds: w.durationSeconds,
      waterTempC: w.waterTempC, phValue: w.phValue, agitationHz: w.agitationHz,
      operatorNote: `[回滚继承 v${target.main.version}] ${w.operatorNote || ''}`,
    });
  }
  return getMainRecord(newMain.id);
}
