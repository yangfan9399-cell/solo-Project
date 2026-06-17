import {
  Project,
  ProjectFilter,
  ExportSummary,
  ApprovalSignature,
  ProjectVersion,
  LoadCalculationResult,
} from './types';
import { calculateAllLoads, getPeakLoads } from './calculations';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import seedProjects from './seedData';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const EXPORT_DIR = path.join(DATA_DIR, 'exports');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
}

export function initializeData() {
  ensureDataDir();
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(seedProjects, null, 2));
  }
}

function readProjects(): Project[] {
  ensureDataDir();
  initializeData();
  const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
  return JSON.parse(data) as Project[];
}

function writeProjects(projects: Project[]) {
  ensureDataDir();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

export function getAllProjects(): Project[] {
  return readProjects();
}

export function getProjectById(id: string): Project | undefined {
  const projects = readProjects();
  return projects.find((p) => p.id === id);
}

export function getProjectByCode(code: string): Project | undefined {
  const projects = readProjects();
  return projects.find((p) => p.code === code);
}

export function createProject(data: Partial<Project>): Project {
  const projects = readProjects();
  const now = new Date().toISOString();

  const project: Project = {
    id: uuidv4(),
    code: data.code || `WY-${Date.now().toString().slice(-6)}`,
    name: data.name || '未命名项目',
    venue: data.venue || '',
    performance: data.performance || '',
    description: data.description || '',
    status: 'draft',
    liftPoints: data.liftPoints || [],
    performers: data.performers || [],
    motionPaths: data.motionPaths || [],
    defaultSafetyFactor: data.defaultSafetyFactor || 5,
    dynamicCoefficient: data.dynamicCoefficient || 1.2,
    impactCoefficient: data.impactCoefficient || 1.5,
    calculationResults: [],
    approvalSignatures: [],
    versionHistory: [],
    currentVersion: 'v1.0',
    currentBatch: `B${Date.now().toString().slice(-4)}`,
    createdAt: now,
    updatedAt: now,
    createdBy: data.createdBy || '系统管理员',
    tags: data.tags || [],
    hasAbnormalData: false,
  };

  project.calculationResults = calculateAllLoads(
    project.liftPoints,
    project.performers,
    project.motionPaths,
    project.defaultSafetyFactor,
    project.dynamicCoefficient,
    project.impactCoefficient
  );

  projects.unshift(project);
  writeProjects(projects);
  return project;
}

export function updateProject(id: string, data: Partial<Project>): Project | undefined {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;

  const now = new Date().toISOString();
  const updated: Project = { ...projects[idx], ...data, updatedAt: now } as Project;

  updated.calculationResults = calculateAllLoads(
    updated.liftPoints,
    updated.performers,
    updated.motionPaths,
    updated.defaultSafetyFactor,
    updated.dynamicCoefficient,
    updated.impactCoefficient
  );

  const peakLoads = getPeakLoads(updated.calculationResults);
  updated.hasAbnormalData = peakLoads.some((r) => r.alertLevel === 'danger');
  if (updated.hasAbnormalData) {
    const dangerPts = peakLoads
      .filter((r) => r.alertLevel === 'danger')
      .map((r) => r.pointName)
      .join('、');
    updated.abnormalNotes = `存在危险载荷吊点：${dangerPts}`;
  }

  projects[idx] = updated;
  writeProjects(projects);
  return updated;
}

export function deleteProject(id: string): boolean {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  projects.splice(idx, 1);
  writeProjects(projects);
  return true;
}

export function filterProjects(filter: ProjectFilter): Project[] {
  const projects = readProjects();
  let result = [...projects];

  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        p.code.toLowerCase().includes(kw) ||
        p.venue.toLowerCase().includes(kw) ||
        p.performance.toLowerCase().includes(kw) ||
        p.description.toLowerCase().includes(kw)
    );
  }

  if (filter.status && filter.status !== 'all') {
    result = result.filter((p) => p.status === filter.status);
  }

  if (filter.hasAbnormal !== undefined && filter.hasAbnormal !== 'all') {
    result = result.filter((p) => p.hasAbnormalData === filter.hasAbnormal);
  }

  if (filter.tag) {
    result = result.filter((p) => p.tags.includes(filter.tag!));
  }

  if (filter.dateFrom) {
    result = result.filter((p) => p.createdAt >= filter.dateFrom!);
  }
  if (filter.dateTo) {
    result = result.filter((p) => p.createdAt <= filter.dateTo! + 'T23:59:59');
  }

  return result;
}

export function createVersion(
  projectId: string,
  changeLog: string,
  createdBy: string
): ProjectVersion | undefined {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx === -1) return undefined;

  const project = projects[idx];
  const now = new Date().toISOString();
  const lastVer = project.versionHistory.length > 0
    ? parseFloat(project.versionHistory[0].version.replace('v', ''))
    : 1.0;
  const newVersionNum = (lastVer + 0.1).toFixed(1);
  const newVersion: ProjectVersion = {
    version: `v${newVersionNum}`,
    batch: `B${Date.now().toString().slice(-4)}`,
    createdAt: now,
    createdBy,
    changeLog,
    snapshot: {
      liftPoints: JSON.parse(JSON.stringify(project.liftPoints)),
      performers: JSON.parse(JSON.stringify(project.performers)),
      motionPaths: JSON.parse(JSON.stringify(project.motionPaths)),
      defaultSafetyFactor: project.defaultSafetyFactor,
      dynamicCoefficient: project.dynamicCoefficient,
      impactCoefficient: project.impactCoefficient,
    },
    calculationResults: JSON.parse(JSON.stringify(project.calculationResults)),
  };

  project.versionHistory.unshift(newVersion);
  project.currentVersion = newVersion.version;
  project.currentBatch = newVersion.batch;
  project.updatedAt = now;

  projects[idx] = project;
  writeProjects(projects);
  return newVersion;
}

export function revertToVersion(
  projectId: string,
  version: string
): Project | undefined {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx === -1) return undefined;

  const project = projects[idx];
  const targetVer = project.versionHistory.find((v) => v.version === version);
  if (!targetVer) return undefined;

  const now = new Date().toISOString();
  project.liftPoints = JSON.parse(JSON.stringify(targetVer.snapshot.liftPoints));
  project.performers = JSON.parse(JSON.stringify(targetVer.snapshot.performers));
  project.motionPaths = JSON.parse(JSON.stringify(targetVer.snapshot.motionPaths));
  project.defaultSafetyFactor = targetVer.snapshot.defaultSafetyFactor;
  project.dynamicCoefficient = targetVer.snapshot.dynamicCoefficient;
  project.impactCoefficient = targetVer.snapshot.impactCoefficient;
  project.calculationResults = targetVer.calculationResults;
  project.currentVersion = targetVer.version;
  project.currentBatch = targetVer.batch;
  project.updatedAt = now;

  const peakLoads = getPeakLoads(project.calculationResults);
  project.hasAbnormalData = peakLoads.some((r) => r.alertLevel === 'danger');

  projects[idx] = project;
  writeProjects(projects);
  return project;
}

export function addApproval(
  projectId: string,
  signature: Omit<ApprovalSignature, 'id' | 'signedAt'>
): ApprovalSignature | undefined {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx === -1) return undefined;

  const project = projects[idx];
  const now = new Date().toISOString();
  const newSignature: ApprovalSignature = {
    ...signature,
    id: uuidv4(),
    signedAt: now,
  };

  project.approvalSignatures.push(newSignature);
  project.updatedAt = now;

  const requiredRoles = ['项目经理', '技术总监', '安全主管'];
  const approvedRoles = project.approvalSignatures.map((s) => s.signerRole);
  if (requiredRoles.every((r) => approvedRoles.includes(r))) {
    project.status = 'approved';
  }

  projects[idx] = project;
  writeProjects(projects);
  return newSignature;
}

export function generateExportSummary(project: Project, exportedBy: string): ExportSummary {
  const peakLoads = getPeakLoads(project.calculationResults);
  const overview = {
    totalLiftPoints: project.liftPoints.length,
    totalPerformers: project.performers.length,
    totalMotionPaths: project.motionPaths.length,
    normalPoints: peakLoads.filter((r) => r.alertLevel === 'normal').length,
    warningPoints: peakLoads.filter((r) => r.alertLevel === 'warning').length,
    dangerPoints: peakLoads.filter((r) => r.alertLevel === 'danger').length,
    maxUtilization: peakLoads.length > 0 ? Math.max(...peakLoads.map((r) => r.utilization)) : 0,
    minSafetyFactor: peakLoads.length > 0 ? Math.min(...peakLoads.map((r) => r.safetyFactor)) : 0,
  };

  const summary: ExportSummary = {
    project: {
      code: project.code,
      name: project.name,
      venue: project.venue,
      performance: project.performance,
      status: project.status,
      version: project.currentVersion,
      batch: project.currentBatch,
    },
    overview,
    liftPoints: project.liftPoints.map((lp) => ({
      name: lp.name,
      type: lp.type,
      maxLoad: lp.maxLoad,
      equipment: lp.equipment,
    })),
    calculations: peakLoads,
    approvals: project.approvalSignatures,
    exportedAt: new Date().toISOString(),
    exportedBy,
  };

  return summary;
}

export function saveExportToFile(
  summary: ExportSummary,
  format: 'json' | 'txt' = 'json'
): string {
  ensureDataDir();
  const filename = `export-${summary.project.code}-${Date.now()}.${format}`;
  const filepath = path.join(EXPORT_DIR, filename);

  if (format === 'json') {
    fs.writeFileSync(filepath, JSON.stringify(summary, null, 2));
  } else {
    const text = formatExportAsText(summary);
    fs.writeFileSync(filepath, text);
  }

  return filepath;
}

function formatExportAsText(summary: ExportSummary): string {
  const lines: string[] = [];
  lines.push('='.repeat(60));
  lines.push('舞台威亚吊点载荷计算报告');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`项目编号: ${summary.project.code}`);
  lines.push(`项目名称: ${summary.project.name}`);
  lines.push(`演出场馆: ${summary.project.venue}`);
  lines.push(`演出剧目: ${summary.project.performance}`);
  lines.push(`项目状态: ${summary.project.status}`);
  lines.push(`版本/批次: ${summary.project.version} / ${summary.project.batch}`);
  lines.push(`导出时间: ${summary.exportedAt}`);
  lines.push(`导出人员: ${summary.exportedBy}`);
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('一、项目概览');
  lines.push('-'.repeat(60));
  lines.push(`吊点总数: ${summary.overview.totalLiftPoints}`);
  lines.push(`演员数量: ${summary.overview.totalPerformers}`);
  lines.push(`运动路径: ${summary.overview.totalMotionPaths}`);
  lines.push(`正常吊点: ${summary.overview.normalPoints}`);
  lines.push(`警告吊点: ${summary.overview.warningPoints}`);
  lines.push(`危险吊点: ${summary.overview.dangerPoints}`);
  lines.push(`最大载荷利用率: ${summary.overview.maxUtilization.toFixed(1)}%`);
  lines.push(`最小安全系数: ${summary.overview.minSafetyFactor.toFixed(2)}`);
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('二、吊点配置');
  lines.push('-'.repeat(60));
  summary.liftPoints.forEach((lp, i) => {
    lines.push(`${i + 1}. ${lp.name} - 类型: ${lp.type}, 额定载荷: ${lp.maxLoad}kg, 设备: ${lp.equipment}`);
  });
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('三、峰值载荷计算结果');
  lines.push('-'.repeat(60));
  summary.calculations.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.pointName}`);
    lines.push(`   静载: ${r.staticLoad}kg, 动载: ${r.dynamicLoad}kg, 冲击载: ${r.impactLoad}kg`);
    lines.push(`   最大载荷: ${r.maxLoad}kg, 安全系数: ${r.safetyFactor}, 利用率: ${r.utilization}%`);
    lines.push(`   状态: ${r.alertLevel.toUpperCase()}`);
  });
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('四、审批签名');
  lines.push('-'.repeat(60));
  summary.approvals.forEach((a) => {
    lines.push(`${a.signerRole}: ${a.signerName} 于 ${a.signedAt} 签署`);
    if (a.comments) lines.push(`  备注: ${a.comments}`);
  });
  lines.push('');
  lines.push('='.repeat(60));
  return lines.join('\n');
}

export function getAllTags(): string[] {
  const projects = readProjects();
  const tagSet = new Set<string>();
  projects.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}
