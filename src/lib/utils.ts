import type { Evidence, InspectionStatus, EvidenceType } from "@prisma/client";
import { REQUIRED_EVIDENCE_TYPES, EVIDENCE_TYPE_LABELS } from "./types";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function getDaysRemaining(deadline: Date | string): number {
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isOverdue(deadline: Date | string): boolean {
  return getDaysRemaining(deadline) < 0;
}

export function getOverdueDays(deadline: Date | string): number {
  return Math.abs(getDaysRemaining(deadline));
}

export interface EvidenceValidationResult {
  isValid: boolean;
  missingTypes: EvidenceType[];
  presentTypes: EvidenceType[];
}

export function validateEvidences(
  evidences: Pick<Evidence, "type">[]
): EvidenceValidationResult {
  const presentTypes = new Set(evidences.map((e) => e.type));
  const missingTypes = REQUIRED_EVIDENCE_TYPES.filter(
    (type) => !presentTypes.has(type)
  );

  return {
    isValid: missingTypes.length === 0,
    missingTypes,
    presentTypes: Array.from(presentTypes) as EvidenceType[],
  };
}

export function getMissingEvidenceLabels(missingTypes: EvidenceType[]): string[] {
  return missingTypes.map((type) => EVIDENCE_TYPE_LABELS[type]);
}

export function getRemediationPath(missingTypes: EvidenceType[]): string {
  const labels = getMissingEvidenceLabels(missingTypes);
  return `请补充上传以下证据：${labels.join("、")}。操作路径：进入整改详情页 → 点击"补充证据" → 上传相应类型的照片 → 重新提交审核。`;
}

export const STATUS_TRANSITIONS: Record<
  InspectionStatus,
  InspectionStatus[]
> = {
  PENDING_RECTIFICATION: ["RECTIFICATION_SUBMITTED", "PENDING_REVIEW"],
  RECTIFICATION_SUBMITTED: ["PENDING_REVIEW", "PENDING_RECTIFICATION"],
  PENDING_REVIEW: ["VERIFIED", "RETURNED", "CLOSED", "PENDING_RECTIFICATION"],
  VERIFIED: ["CLOSED", "ARCHIVED", "RETURNED"],
  RETURNED: ["PENDING_RECTIFICATION", "PENDING_REVIEW"],
  ARCHIVED: ["PENDING_REVIEW", "CLOSED"],
  CLOSED: [],
};

export function canTransition(
  from: InspectionStatus,
  to: InspectionStatus
): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function generateInspectionNo(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INSP-${year}-${random}`;
}

export function validateBuildingMatch(
  photoDescription: string,
  buildingName: string,
  buildingCode: string
): { isMatch: boolean; confidence: number } {
  const description = photoDescription.toLowerCase();
  const name = buildingName.toLowerCase();
  const code = buildingCode.toLowerCase();

  let score = 0;
  if (description.includes(name)) score += 50;
  if (description.includes(code)) score += 30;
  if (description.includes(buildingName.replace("号楼", ""))) score += 20;

  return {
    isMatch: score >= 30,
    confidence: score,
  };
}
