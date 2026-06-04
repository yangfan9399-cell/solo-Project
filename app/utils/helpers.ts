import type { SubsidyLevel, SubsidyCalculation } from "./types";

export const subsidyStandards: { level: SubsidyLevel; name: string; minIncome: number; maxIncome: number; amount: number; description: string }[] = [
  { level: "LEVEL_1", name: "特困一档", minIncome: 0, maxIncome: 800, amount: 2000, description: "家庭人均月收入800元以下" },
  { level: "LEVEL_2", name: "困难二档", minIncome: 801, maxIncome: 1500, amount: 1500, description: "家庭人均月收入801-1500元" },
  { level: "LEVEL_3", name: "一般三档", minIncome: 1501, maxIncome: 2500, amount: 1000, description: "家庭人均月收入1501-2500元" },
  { level: "LEVEL_4", name: "临时四档", minIncome: 2501, maxIncome: 3500, amount: 600, description: "家庭人均月收入2501-3500元，临时困难" },
  { level: "LEVEL_5", name: "特殊五档", minIncome: 3501, maxIncome: 99999, amount: 300, description: "特殊情况补助，需工会主席审批" },
];

export function calculateSubsidy(
  familyMembers: { monthlyIncome: number }[],
  requestedLevel: SubsidyLevel,
): SubsidyCalculation {
  const totalIncome = familyMembers.reduce((sum, m) => sum + Number(m.monthlyIncome), 0);
  const familySize = familyMembers.length;
  const averageIncome = familySize > 0 ? totalIncome / familySize : 0;

  let calculatedLevel: SubsidyLevel = "LEVEL_5";
  for (const standard of subsidyStandards) {
    if (averageIncome >= standard.minIncome && averageIncome <= standard.maxIncome) {
      calculatedLevel = standard.level;
      break;
    }
  }

  const levelOrder: SubsidyLevel[] = ["LEVEL_1", "LEVEL_2", "LEVEL_3", "LEVEL_4", "LEVEL_5"];
  const calculatedIndex = levelOrder.indexOf(calculatedLevel);
  const requestedIndex = levelOrder.indexOf(requestedLevel);
  const exceedsStandard = requestedIndex < calculatedIndex;
  const difference = requestedIndex - calculatedIndex;

  let approvalPath: string[] = [];
  if (exceedsStandard) {
    if (difference <= -1) approvalPath.push("经办人核实");
    if (difference <= -2) approvalPath.push("工会副主席审批");
    if (difference <= -3) approvalPath.push("工会主席审批");
  }

  return {
    totalIncome,
    familySize,
    averageIncome,
    calculatedLevel,
    requestedLevel,
    exceedsStandard,
    difference: Math.abs(difference),
    approvalPath,
  };
}

export function getSubsidyAmount(level: SubsidyLevel): number {
  return subsidyStandards.find((s) => s.level === level)?.amount || 0;
}

export function getSubsidyLevelName(level: SubsidyLevel): string {
  return subsidyStandards.find((s) => s.level === level)?.name || level;
}

export function getStatusText(status: string): string {
  const map: Record<string, string> = {
    PENDING_HANDLER: "待经办人处理",
    PENDING_REVIEW: "待复核",
    APPROVED: "已批准",
    REJECTED: "已驳回",
    ARCHIVED: "已归档",
  };
  return map[status] || status;
}

export function getDocumentTypeName(type: string): string {
  const map: Record<string, string> = {
    ID_CARD: "身份证",
    HOUSEHOLD_REGISTER: "户口本",
    INCOME_PROOF: "收入证明",
    MEDICAL_CERTIFICATE: "医疗证明",
    DIFFICULTY_PROOF: "困难证明",
    OTHER: "其他材料",
  };
  return map[type] || type;
}

export function getActionTypeText(type: string): string {
  const map: Record<string, string> = {
    SUBMIT_APPLICATION: "提交申请",
    UPLOAD_DOCUMENT: "上传材料",
    ADJUST_SUBSIDY_LEVEL: "调整补助档位",
    ADD_NOTE: "添加备注",
    APPROVE: "批准发放",
    REJECT: "驳回申请",
    ARCHIVE: "归档",
    REOPEN: "重新开启",
  };
  return map[type] || type;
}

export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
