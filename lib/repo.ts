import { BowArchive, BowVersion, TargetPoint, Equipment, ExportSummary, AnomalyAlert } from "./types";
import { getDb, saveDb } from "./db";
import { v4 as uuid } from "uuid";

export const archivesRepo = {
  list(params?: { status?: string; bowType?: string; search?: string }): BowArchive[] {
    const db = getDb();
    let rows = db.archives.slice();
    if (params?.status) rows = rows.filter((r) => r.status === params.status);
    if (params?.bowType) rows = rows.filter((r) => r.bowType === params.bowType);
    if (params?.search) {
      const s = params.search.toLowerCase();
      rows = rows.filter((r) =>
        r.name.toLowerCase().includes(s) ||
        (r.notes || "").toLowerCase().includes(s) ||
        r.bowType.toLowerCase().includes(s)
      );
    }
    rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return rows;
  },

  get(id: string): BowArchive | undefined {
    return getDb().archives.find((r) => r.id === id);
  },

  create(data: Omit<BowArchive, "id" | "createdAt" | "updatedAt">): BowArchive {
    const db = getDb();
    const now = new Date().toISOString();
    const row = { ...data, id: uuid(), createdAt: now, updatedAt: now } as BowArchive;
    db.archives.push(row);
    saveDb(db);
    return row;
  },

  update(id: string, data: Partial<BowArchive>): BowArchive | undefined {
    const db = getDb();
    const idx = db.archives.findIndex((r) => r.id === id);
    if (idx < 0) return undefined;
    const now = new Date().toISOString();
    db.archives[idx] = { ...db.archives[idx], ...data, updatedAt: now };
    saveDb(db);
    return db.archives[idx];
  },

  remove(id: string): boolean {
    const db = getDb();
    const before = db.archives.length;
    db.archives = db.archives.filter((r) => r.id !== id);
    db.versions = db.versions.filter((r) => r.archiveId !== id);
    db.points = db.points.filter((r) => r.archiveId !== id);
    db.anomalies = db.anomalies.filter((r) => r.archiveId !== id);
    saveDb(db);
    return db.archives.length < before;
  },
};

export const versionsRepo = {
  listByArchive(archiveId: string): BowVersion[] {
    return getDb()
      .versions.filter((r) => r.archiveId === archiveId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  },

  get(id: string): BowVersion | undefined {
    return getDb().versions.find((r) => r.id === id);
  },

  create(data: Omit<BowVersion, "id" | "createdAt">): BowVersion {
    const db = getDb();
    const now = new Date().toISOString();
    const row = { ...data, id: uuid(), createdAt: now } as BowVersion;
    db.versions.push(row);
    saveDb(db);
    return row;
  },
};

export const pointsRepo = {
  listByArchive(archiveId: string): TargetPoint[] {
    return getDb()
      .points.filter((r) => r.archiveId === archiveId)
      .sort((a, b) => a.arrowNumber - b.arrowNumber);
  },

  create(data: Omit<TargetPoint, "id">): TargetPoint {
    const db = getDb();
    const row = { ...data, id: uuid() } as TargetPoint;
    db.points.push(row);
    saveDb(db);
    return row;
  },

  remove(id: string): boolean {
    const db = getDb();
    const before = db.points.length;
    db.points = db.points.filter((r) => r.id !== id);
    saveDb(db);
    return db.points.length < before;
  },

  clearByArchive(archiveId: string): void {
    const db = getDb();
    db.points = db.points.filter((r) => r.archiveId !== archiveId);
    saveDb(db);
  },
};

export const equipmentRepo = {
  list(category?: string): Equipment[] {
    let rows = getDb().equipment.slice();
    if (category) rows = rows.filter((r) => r.category === category);
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return rows;
  },

  get(id: string): Equipment | undefined {
    return getDb().equipment.find((r) => r.id === id);
  },

  create(data: Omit<Equipment, "id" | "createdAt">): Equipment {
    const db = getDb();
    const now = new Date().toISOString();
    const row = { ...data, id: uuid(), createdAt: now } as Equipment;
    db.equipment.push(row);
    saveDb(db);
    return row;
  },

  update(id: string, data: Partial<Equipment>): Equipment | undefined {
    const db = getDb();
    const idx = db.equipment.findIndex((r) => r.id === id);
    if (idx < 0) return undefined;
    db.equipment[idx] = { ...db.equipment[idx], ...data };
    saveDb(db);
    return db.equipment[idx];
  },

  remove(id: string): boolean {
    const db = getDb();
    const before = db.equipment.length;
    db.equipment = db.equipment.filter((r) => r.id !== id);
    saveDb(db);
    return db.equipment.length < before;
  },
};

export const exportsRepo = {
  list(): ExportSummary[] {
    return getDb()
      .exports.slice()
      .sort((a, b) => b.exportedAt.localeCompare(a.exportedAt));
  },

  create(data: Omit<ExportSummary, "id" | "exportedAt">): ExportSummary {
    const db = getDb();
    const now = new Date().toISOString();
    const row = { ...data, id: uuid(), exportedAt: now } as ExportSummary;
    db.exports.push(row);
    saveDb(db);
    return row;
  },
};

export const anomaliesRepo = {
  listByArchive(archiveId: string): AnomalyAlert[] {
    return getDb()
      .anomalies.filter((r) => r.archiveId === archiveId)
      .sort((a, b) => {
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const diff = (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
        if (diff !== 0) return diff;
        return b.detectedAt.localeCompare(a.detectedAt);
      });
  },

  listAll(): AnomalyAlert[] {
    return getDb()
      .anomalies.slice()
      .sort((a, b) => {
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const diff = (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
        if (diff !== 0) return diff;
        return b.detectedAt.localeCompare(a.detectedAt);
      });
  },

  create(data: Omit<AnomalyAlert, "id" | "detectedAt">): AnomalyAlert {
    const db = getDb();
    const now = new Date().toISOString();
    const row = { ...data, id: uuid(), detectedAt: now } as AnomalyAlert;
    db.anomalies.push(row);
    saveDb(db);
    return row;
  },

  clearByArchive(archiveId: string): void {
    const db = getDb();
    db.anomalies = db.anomalies.filter((r) => r.archiveId !== archiveId);
    saveDb(db);
  },
};
