import { isBrowser } from '@builder.io/qwik';
import type { Project, Sample, Batch, VersionSnapshot, Anomaly, ExportRecord, RegionStat } from '../types';

const KEYS = {
  projects: 'dtp_projects',
  samples: 'dtp_samples',
  batches: 'dtp_batches',
  versions: 'dtp_versions',
  anomalies: 'dtp_anomalies',
  exports: 'dtp_exports',
};

function load<T>(key: string): T[] {
  if (!isBrowser) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function getAllProjects(): Project[] {
  return load<Project>(KEYS.projects);
}

export function getProject(id: string): Project | null {
  return getAllProjects().find((p) => p.id === id) ?? null;
}

export function saveProject(project: Project): void {
  const items = getAllProjects();
  const idx = items.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    items[idx] = project;
  } else {
    items.push(project);
  }
  save(KEYS.projects, items);
}

export function deleteProject(id: string): void {
  save(KEYS.projects, getAllProjects().filter((p) => p.id !== id));
}

export function getAllSamples(projectId?: string): Sample[] {
  const items = load<Sample>(KEYS.samples);
  return projectId ? items.filter((s) => s.projectId === projectId) : items;
}

export function getSample(id: string): Sample | null {
  return load<Sample>(KEYS.samples).find((s) => s.id === id) ?? null;
}

export function saveSample(sample: Sample): void {
  const items = load<Sample>(KEYS.samples);
  const idx = items.findIndex((s) => s.id === sample.id);
  if (idx >= 0) {
    items[idx] = sample;
  } else {
    items.push(sample);
  }
  save(KEYS.samples, items);
}

export function deleteSample(id: string): void {
  save(KEYS.samples, load<Sample>(KEYS.samples).filter((s) => s.id !== id));
}

export function getAllBatches(projectId?: string): Batch[] {
  const items = load<Batch>(KEYS.batches);
  return projectId ? items.filter((b) => b.projectId === projectId) : items;
}

export function getBatch(id: string): Batch | null {
  return load<Batch>(KEYS.batches).find((b) => b.id === id) ?? null;
}

export function saveBatch(batch: Batch): void {
  const items = load<Batch>(KEYS.batches);
  const idx = items.findIndex((b) => b.id === batch.id);
  if (idx >= 0) {
    items[idx] = batch;
  } else {
    items.push(batch);
  }
  save(KEYS.batches, items);
}

export function getAllVersions(projectId?: string): VersionSnapshot[] {
  const items = load<VersionSnapshot>(KEYS.versions);
  return projectId ? items.filter((v) => v.projectId === projectId) : items;
}

export function getVersion(id: string): VersionSnapshot | null {
  return load<VersionSnapshot>(KEYS.versions).find((v) => v.id === id) ?? null;
}

export function saveVersion(version: VersionSnapshot): void {
  const items = load<VersionSnapshot>(KEYS.versions);
  const idx = items.findIndex((v) => v.id === version.id);
  if (idx >= 0) {
    items[idx] = version;
  } else {
    items.push(version);
  }
  save(KEYS.versions, items);
}

export function getAllAnomalies(projectId?: string, resolved?: boolean): Anomaly[] {
  let items = load<Anomaly>(KEYS.anomalies);
  if (projectId) {
    items = items.filter((a) => a.projectId === projectId);
  }
  if (resolved !== undefined) {
    items = items.filter((a) => a.resolved === resolved);
  }
  return items;
}

export function saveAnomaly(anomaly: Anomaly): void {
  const items = load<Anomaly>(KEYS.anomalies);
  const idx = items.findIndex((a) => a.id === anomaly.id);
  if (idx >= 0) {
    items[idx] = anomaly;
  } else {
    items.push(anomaly);
  }
  save(KEYS.anomalies, items);
}

export function resolveAnomaly(id: string): void {
  const items = load<Anomaly>(KEYS.anomalies);
  const idx = items.findIndex((a) => a.id === id);
  if (idx >= 0) {
    items[idx].resolved = true;
    save(KEYS.anomalies, items);
  }
}

export function getAllExports(projectId?: string): ExportRecord[] {
  const items = load<ExportRecord>(KEYS.exports);
  return projectId ? items.filter((e) => e.projectId === projectId) : items;
}

export function saveExport(record: ExportRecord): void {
  const items = load<ExportRecord>(KEYS.exports);
  items.push(record);
  save(KEYS.exports, items);
}

export function getRegionStats(): RegionStat[] {
  const projects = getAllProjects();
  const samples = load<Sample>(KEYS.samples);
  const regionMap = new Map<string, RegionStat>();

  for (const project of projects) {
    const key = `${project.region}|${project.dialect}`;
    if (!regionMap.has(key)) {
      regionMap.set(key, {
        region: project.region,
        dialect: project.dialect,
        projectCount: 0,
        sampleCount: 0,
        toneCategories: {},
      });
    }
    const stat = regionMap.get(key)!;
    stat.projectCount += 1;

    const projectSamples = samples.filter((s) => s.projectId === project.id);
    stat.sampleCount += projectSamples.length;

    for (const sample of projectSamples) {
      const cat = sample.toneCategory;
      if (!stat.toneCategories[cat]) {
        stat.toneCategories[cat] = { value: sample.toneValue, count: 0 };
      }
      stat.toneCategories[cat].count += 1;
    }
  }

  return Array.from(regionMap.values());
}

export function clearAllData(): void {
  if (!isBrowser) return;
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('dtp_seeded');
}
