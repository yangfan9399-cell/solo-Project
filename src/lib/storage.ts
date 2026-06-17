import type { Project, InspectionFrame, Defect, ReviewBatch, Version, Anomaly, ExportRecord } from "./types";

const STORAGE_KEYS = {
  projects: "pipeline_projects",
  frames: "pipeline_frames",
  defects: "pipeline_defects",
  reviews: "pipeline_reviews",
  versions: "pipeline_versions",
  anomalies: "pipeline_anomalies",
  exports: "pipeline_exports",
  initialized: "pipeline_initialized",
} as const;

function getItem<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setItem<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

export const storage = {
  isInitialized(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEYS.initialized) === "true";
  },

  markInitialized(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.initialized, "true");
  },

  reset(): void {
    if (typeof window === "undefined") return;
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },

  projects: {
    getAll(): Project[] { return getItem<Project>(STORAGE_KEYS.projects); },
    getById(id: string): Project | undefined { return this.getAll().find((p) => p.id === id); },
    create(project: Project): void { const all = this.getAll(); all.push(project); setItem(STORAGE_KEYS.projects, all); },
    update(id: string, data: Partial<Project>): void {
      const all = this.getAll();
      const idx = all.findIndex((p) => p.id === id);
      if (idx >= 0) { all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() }; setItem(STORAGE_KEYS.projects, all); }
    },
    delete(id: string): void { setItem(STORAGE_KEYS.projects, this.getAll().filter((p) => p.id !== id)); },
  },

  frames: {
    getAll(): InspectionFrame[] { return getItem<InspectionFrame>(STORAGE_KEYS.frames); },
    getByProject(projectId: string): InspectionFrame[] { return this.getAll().filter((f) => f.projectId === projectId); },
    getById(id: string): InspectionFrame | undefined { return this.getAll().find((f) => f.id === id); },
    create(frame: InspectionFrame): void { const all = this.getAll(); all.push(frame); setItem(STORAGE_KEYS.frames, all); },
    update(id: string, data: Partial<InspectionFrame>): void {
      const all = this.getAll();
      const idx = all.findIndex((f) => f.id === id);
      if (idx >= 0) { all[idx] = { ...all[idx], ...data }; setItem(STORAGE_KEYS.frames, all); }
    },
    delete(id: string): void { setItem(STORAGE_KEYS.frames, this.getAll().filter((f) => f.id !== id)); },
  },

  defects: {
    getAll(): Defect[] { return getItem<Defect>(STORAGE_KEYS.defects); },
    getByProject(projectId: string): Defect[] { return this.getAll().filter((d) => d.projectId === projectId); },
    getByFrame(frameId: string): Defect[] { return this.getAll().filter((d) => d.frameId === frameId); },
    getById(id: string): Defect | undefined { return this.getAll().find((d) => d.id === id); },
    create(defect: Defect): void { const all = this.getAll(); all.push(defect); setItem(STORAGE_KEYS.defects, all); },
    update(id: string, data: Partial<Defect>): void {
      const all = this.getAll();
      const idx = all.findIndex((d) => d.id === id);
      if (idx >= 0) { all[idx] = { ...all[idx], ...data }; setItem(STORAGE_KEYS.defects, all); }
    },
    delete(id: string): void { setItem(STORAGE_KEYS.defects, this.getAll().filter((d) => d.id !== id)); },
  },

  reviews: {
    getAll(): ReviewBatch[] { return getItem<ReviewBatch>(STORAGE_KEYS.reviews); },
    getByProject(projectId: string): ReviewBatch[] { return this.getAll().filter((r) => r.projectId === projectId); },
    getById(id: string): ReviewBatch | undefined { return this.getAll().find((r) => r.id === id); },
    create(review: ReviewBatch): void { const all = this.getAll(); all.push(review); setItem(STORAGE_KEYS.reviews, all); },
    update(id: string, data: Partial<ReviewBatch>): void {
      const all = this.getAll();
      const idx = all.findIndex((r) => r.id === id);
      if (idx >= 0) { all[idx] = { ...all[idx], ...data }; setItem(STORAGE_KEYS.reviews, all); }
    },
  },

  versions: {
    getAll(): Version[] { return getItem<Version>(STORAGE_KEYS.versions); },
    getByProject(projectId: string): Version[] { return this.getAll().filter((v) => v.projectId === projectId); },
    create(version: Version): void { const all = this.getAll(); all.push(version); setItem(STORAGE_KEYS.versions, all); },
  },

  anomalies: {
    getAll(): Anomaly[] { return getItem<Anomaly>(STORAGE_KEYS.anomalies); },
    getByProject(projectId: string): Anomaly[] { return this.getAll().filter((a) => a.projectId === projectId); },
    create(anomaly: Anomaly): void { const all = this.getAll(); all.push(anomaly); setItem(STORAGE_KEYS.anomalies, all); },
    resolve(id: string): void {
      const all = this.getAll();
      const idx = all.findIndex((a) => a.id === id);
      if (idx >= 0) { all[idx] = { ...all[idx], resolved: true, resolvedAt: new Date().toISOString() }; setItem(STORAGE_KEYS.anomalies, all); }
    },
  },

  exports: {
    getAll(): ExportRecord[] { return getItem<ExportRecord>(STORAGE_KEYS.exports); },
    getByProject(projectId: string): ExportRecord[] { return this.getAll().filter((e) => e.projectId === projectId); },
    create(record: ExportRecord): void { const all = this.getAll(); all.push(record); setItem(STORAGE_KEYS.exports, all); },
  },
};
