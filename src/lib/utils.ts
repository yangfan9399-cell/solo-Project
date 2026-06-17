import type { DefectType, SeverityLevel, ProjectStatus, ReviewStatus, Anomaly } from "./types";
import { DEFECT_TYPE_LABELS, SEVERITY_LABELS, PROJECT_STATUS_LABELS, REVIEW_STATUS_LABELS, ANOMALY_TYPE_LABELS } from "./types";

export function defectTypeLabel(t: DefectType): string {
  return DEFECT_TYPE_LABELS[t];
}

export function severityLabel(s: SeverityLevel): string {
  return SEVERITY_LABELS[s];
}

export function projectStatusLabel(s: ProjectStatus): string {
  return PROJECT_STATUS_LABELS[s];
}

export function reviewStatusLabel(s: ReviewStatus): string {
  return REVIEW_STATUS_LABELS[s];
}

export function anomalyTypeLabel(t: Anomaly["type"]): string {
  return ANOMALY_TYPE_LABELS[t];
}

export function defectTypeBadgeClass(t: DefectType): string {
  const map: Record<DefectType, string> = {
    crack: "badge-crack",
    deposit: "badge-deposit",
    misalign: "badge-misalign",
    leak: "badge-leak",
    corrosion: "badge-corrosion",
    disjoint: "badge-disjoint",
    branch: "badge-branch",
    deform: "badge-deform",
  };
  return map[t];
}

export function severityBadgeClass(s: SeverityLevel): string {
  return `severity-${s}`;
}

export function reviewStatusBadgeClass(s: ReviewStatus): string {
  const map: Record<ReviewStatus, string> = {
    pending: "status-pending",
    reviewing: "status-reviewing",
    approved: "status-approved",
    rejected: "status-rejected",
  };
  return map[s];
}

export function projectStatusBadgeClass(s: ProjectStatus): string {
  const map: Record<ProjectStatus, string> = {
    ongoing: "status-reviewing",
    completed: "status-approved",
    pending_review: "status-pending",
  };
  return map[s];
}

export function uid(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function formatDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function formatDateTime(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function generateCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob(["\uFEFF" + content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
