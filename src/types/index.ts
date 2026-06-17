export interface DynastyRule {
  id: string;
  dynasty: string;
  emperor: string;
  reignTitle: string;
  tabooCharacter: string;
  replacementCharacter: string;
  reason: string;
  startYear: number;
  endYear: number;
  severity: "strict" | "moderate" | "mild";
  sources: string[];
}

export interface SuspectedReplacement {
  id: string;
  projectId: string;
  position: number;
  originalChar: string;
  tabooChar: string;
  replacementChar: string;
  contextBefore: string;
  contextAfter: string;
  dynastyRuleId: string;
  confidence: number;
  status: "pending" | "confirmed" | "rejected" | "manual";
  reviewedBy?: string;
  reviewedAt?: string;
  note?: string;
}

export type ProjectStatus = "draft" | "in_review" | "reviewed" | "exported" | "archived";

export interface Project {
  id: string;
  name: string;
  textName: string;
  author: string;
  dynasty: string;
  sourceDynasty: string;
  description: string;
  originalText: string;
  currentText: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  assignee?: string;
  dynastyRuleIds: string[];
  totalSuspected: number;
  confirmedCount: number;
  rejectedCount: number;
  pendingCount: number;
  manualCount: number;
  anomalyCount: number;
  priority: "high" | "medium" | "low";
  dueDate?: string;
  tags: string[];
  batchId?: string;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  versionNumber: string;
  batchId?: string;
  createdAt: string;
  createdBy: string;
  snapshot: Project;
  replacementsSnapshot: SuspectedReplacement[];
  changeSummary: string;
  comment?: string;
}

export interface Annotation {
  id: string;
  projectId: string;
  replacementId?: string;
  position: number;
  type: "replacement" | "comment" | "query" | "reference" | "issue";
  content: string;
  author: string;
  createdAt: string;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface AnomalyReport {
  id: string;
  projectId: string;
  type: "inconsistency" | "missing_rule" | "character_collision" | "unexpected_pattern" | "version_conflict";
  severity: "critical" | "warning" | "info";
  description: string;
  affectedReplacements: string[];
  detectedAt: string;
  resolved: boolean;
  suggestedAction?: string;
}

export interface ExportSummary {
  id: string;
  projectId: string;
  versionId?: string;
  exportedAt: string;
  exportedBy: string;
  format: "txt" | "csv" | "json" | "xml";
  summaryContent: string;
  stats: {
    totalCharacters: number;
    totalReplacements: number;
    confirmed: number;
    rejected: number;
    manual: number;
    annotations: number;
    dynastiesCovered: string[];
  };
}

export interface FilterOptions {
  search: string;
  status: ProjectStatus[];
  dynasty: string[];
  priority: ("high" | "medium" | "low")[];
  assignee: string[];
  hasAnomaly: boolean | null;
  dateFrom?: string;
  dateTo?: string;
  tags: string[];
}
