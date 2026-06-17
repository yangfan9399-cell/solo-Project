import {
  dynastyRules as seedRules,
  projects as seedProjects,
  suspectedReplacements as seedReplacements,
  projectVersions as seedVersions,
  annotations as seedAnnotations,
  anomalyReports as seedAnomalies,
  exportSummaries as seedExports
} from "./sampleData";
import type {
  DynastyRule,
  Project,
  SuspectedReplacement,
  ProjectVersion,
  Annotation,
  AnomalyReport,
  ExportSummary,
  FilterOptions
} from "../types";

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

class DataStore {
  private rules: DynastyRule[] = clone(seedRules);
  private projects: Project[] = clone(seedProjects);
  private replacements: SuspectedReplacement[] = clone(seedReplacements);
  private versions: ProjectVersion[] = clone(seedVersions);
  private annotations: Annotation[] = clone(seedAnnotations);
  private anomalies: AnomalyReport[] = clone(seedAnomalies);
  private exports: ExportSummary[] = clone(seedExports);

  getAllDynastyRules(): DynastyRule[] { return clone(this.rules); }
  getDynastyRule(id: string): DynastyRule | undefined {
    return clone(this.rules.find(r => r.id === id));
  }

  filterProjects(opts: FilterOptions): Project[] {
    let list = clone(this.projects);
    if (opts.search) {
      const q = opts.search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.textName.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (opts.status && opts.status.length)
      list = list.filter(p => opts.status.includes(p.status));
    if (opts.dynasty && opts.dynasty.length)
      list = list.filter(p => opts.dynasty.includes(p.dynasty) || opts.dynasty.includes(p.sourceDynasty));
    if (opts.priority && opts.priority.length)
      list = list.filter(p => opts.priority.includes(p.priority));
    if (opts.assignee && opts.assignee.length)
      list = list.filter(p => p.assignee && opts.assignee.includes(p.assignee));
    if (opts.hasAnomaly === true)
      list = list.filter(p => p.anomalyCount > 0);
    if (opts.hasAnomaly === false)
      list = list.filter(p => p.anomalyCount === 0);
    if (opts.dateFrom)
      list = list.filter(p => p.createdAt >= opts.dateFrom!);
    if (opts.dateTo)
      list = list.filter(p => p.createdAt <= opts.dateTo!);
    if (opts.tags && opts.tags.length)
      list = list.filter(p => p.tags.some(t => opts.tags.includes(t)));
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getAllProjects(): Project[] { return clone(this.projects); }
  getProject(id: string): Project | undefined {
    return clone(this.projects.find(p => p.id === id));
  }
  updateProject(id: string, patch: Partial<Project>): Project | undefined {
    const i = this.projects.findIndex(p => p.id === id);
    if (i === -1) return undefined;
    this.projects[i] = { ...this.projects[i], ...patch, updatedAt: new Date().toISOString() };
    return clone(this.projects[i]);
  }
  createProject(data: Omit<Project, "id" | "createdAt" | "updatedAt">): Project {
    const id = `PROJ-2025-${(this.projects.length + 1).toString().padStart(3, "0")}`;
    const now = new Date().toISOString();
    const proj: Project = { ...data, id, createdAt: now, updatedAt: now };
    this.projects.push(proj);
    return clone(proj);
  }

  getReplacements(projectId: string): SuspectedReplacement[] {
    return clone(this.replacements.filter(r => r.projectId === projectId));
  }
  getReplacement(id: string): SuspectedReplacement | undefined {
    return clone(this.replacements.find(r => r.id === id));
  }
  updateReplacement(id: string, patch: Partial<SuspectedReplacement>): SuspectedReplacement | undefined {
    const i = this.replacements.findIndex(r => r.id === id);
    if (i === -1) return undefined;
    this.replacements[i] = { ...this.replacements[i], ...patch };
    const rep = this.replacements[i];
    this.refreshProjectCounts(rep.projectId);
    return clone(rep);
  }

  private refreshProjectCounts(projectId: string) {
    const reps = this.replacements.filter(r => r.projectId === projectId);
    const p = this.projects.find(pp => pp.id === projectId);
    if (!p) return;
    p.totalSuspected = reps.length;
    p.confirmedCount = reps.filter(r => r.status === "confirmed").length;
    p.rejectedCount = reps.filter(r => r.status === "rejected").length;
    p.pendingCount = reps.filter(r => r.status === "pending").length;
    p.manualCount = reps.filter(r => r.status === "manual").length;
    p.updatedAt = new Date().toISOString();
  }

  getVersions(projectId: string): ProjectVersion[] {
    return clone(this.versions
      .filter(v => v.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }
  getVersion(id: string): ProjectVersion | undefined {
    return clone(this.versions.find(v => v.id === id));
  }
  createVersion(data: Omit<ProjectVersion, "id" | "createdAt">): ProjectVersion {
    const projVers = this.versions.filter(v => v.projectId === data.projectId);
    const id = `VER-${data.projectId.replace("PROJ-", "P")}-V${projVers.length + 1}`;
    const now = new Date().toISOString();
    const v: ProjectVersion = { ...data, id, createdAt: now };
    this.versions.push(v);
    return clone(v);
  }

  getAnnotations(projectId: string): Annotation[] {
    return clone(this.annotations
      .filter(a => a.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }
  createAnnotation(data: Omit<Annotation, "id" | "createdAt">): Annotation {
    const id = `ANN-${(this.annotations.length + 1).toString().padStart(3, "0")}`;
    const a: Annotation = { ...data, id, createdAt: new Date().toISOString() };
    this.annotations.push(a);
    return clone(a);
  }
  resolveAnnotation(id: string, resolver: string): Annotation | undefined {
    const i = this.annotations.findIndex(a => a.id === id);
    if (i === -1) return undefined;
    this.annotations[i] = {
      ...this.annotations[i],
      resolved: true,
      resolvedBy: resolver,
      resolvedAt: new Date().toISOString()
    };
    return clone(this.annotations[i]);
  }

  getAnomalies(projectId?: string): AnomalyReport[] {
    let list = clone(this.anomalies);
    if (projectId) list = list.filter(a => a.projectId === projectId);
    return list.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  }
  resolveAnomaly(id: string): AnomalyReport | undefined {
    const i = this.anomalies.findIndex(a => a.id === id);
    if (i === -1) return undefined;
    this.anomalies[i] = { ...this.anomalies[i], resolved: true };
    return clone(this.anomalies[i]);
  }

  getExportSummaries(projectId?: string): ExportSummary[] {
    let list = clone(this.exports);
    if (projectId) list = list.filter(e => e.projectId === projectId);
    return list.sort((a, b) => b.exportedAt.localeCompare(a.exportedAt));
  }
  createExport(data: Omit<ExportSummary, "id" | "exportedAt">): ExportSummary {
    const id = `EXP-${(this.exports.length + 1).toString().padStart(3, "0")}`;
    const e: ExportSummary = { ...data, id, exportedAt: new Date().toISOString() };
    this.exports.push(e);
    return clone(e);
  }

  getStats() {
    return {
      totalProjects: this.projects.length,
      inReview: this.projects.filter(p => p.status === "in_review").length,
      pending: this.replacements.filter(r => r.status === "pending").length,
      anomalies: this.anomalies.filter(a => !a.resolved).length,
      dynastyCoverage: Array.from(new Set(this.rules.map(r => r.dynasty))).length
    };
  }
}

const singleton = new DataStore();
export default singleton;
