import { cn } from "@/lib/utils";
import type { SampleStatus, SealStatus, TestResultStatus, DisposalType, AbnormalType, UserRole } from "@prisma/client";

interface StatusBadgeProps {
  status: string;
  type?: "sample" | "seal" | "test" | "disposal" | "abnormal" | "role";
  className?: string;
}

export function StatusBadge({ status, type = "sample", className }: StatusBadgeProps) {
  const config = getStatusConfig(status, type);

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.bgColor,
        config.textColor,
        className
      )}
    >
      {config.label}
    </span>
  );
}

function getStatusConfig(status: string, type: string) {
  switch (type) {
    case "sample":
      return getSampleStatusConfig(status as SampleStatus);
    case "seal":
      return getSealStatusConfig(status as SealStatus);
    case "test":
      return getTestStatusConfig(status as TestResultStatus);
    case "disposal":
      return getDisposalTypeConfig(status as DisposalType);
    case "abnormal":
      return getAbnormalTypeConfig(status as AbnormalType);
    case "role":
      return getRoleConfig(status as UserRole);
    default:
      return { label: status, bgColor: "bg-gray-100", textColor: "text-gray-800" };
  }
}

function getSampleStatusConfig(status: SampleStatus) {
  const configs: Record<SampleStatus, { label: string; bgColor: string; textColor: string }> = {
    SAMPLING: { label: "待取样", bgColor: "bg-gray-100", textColor: "text-gray-800" },
    SAMPLED: { label: "已取样", bgColor: "bg-blue-100", textColor: "text-blue-800" },
    SENT_TO_LAB: { label: "已送检", bgColor: "bg-purple-100", textColor: "text-purple-800" },
    TESTING: { label: "检测中", bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
    TEST_COMPLETED: { label: "检测完成", bgColor: "bg-green-100", textColor: "text-green-800" },
    PENDING_DISPOSAL: { label: "待处置", bgColor: "bg-orange-100", textColor: "text-orange-800" },
    DISPOSED: { label: "已处置", bgColor: "bg-green-100", textColor: "text-green-800" },
    RE_SAMPLING: { label: "需重取", bgColor: "bg-red-100", textColor: "text-red-800" },
    ARCHIVED: { label: "已归档", bgColor: "bg-slate-100", textColor: "text-slate-800" },
  };
  return configs[status] || { label: status, bgColor: "bg-gray-100", textColor: "text-gray-800" };
}

function getSealStatusConfig(status: SealStatus) {
  const configs: Record<SealStatus, { label: string; bgColor: string; textColor: string }> = {
    INTACT: { label: "完好", bgColor: "bg-green-100", textColor: "text-green-800" },
    DAMAGED: { label: "破损", bgColor: "bg-red-100", textColor: "text-red-800" },
    VERIFIED: { label: "已核验", bgColor: "bg-blue-100", textColor: "text-blue-800" },
  };
  return configs[status] || { label: status, bgColor: "bg-gray-100", textColor: "text-gray-800" };
}

function getTestStatusConfig(status: TestResultStatus) {
  const configs: Record<TestResultStatus, { label: string; bgColor: string; textColor: string }> = {
    NOT_TESTED: { label: "未检测", bgColor: "bg-gray-100", textColor: "text-gray-800" },
    PENDING: { label: "待检测", bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
    PASSED: { label: "合格", bgColor: "bg-green-100", textColor: "text-green-800" },
    FAILED: { label: "不合格", bgColor: "bg-red-100", textColor: "text-red-800" },
  };
  return configs[status] || { label: status, bgColor: "bg-gray-100", textColor: "text-gray-800" };
}

function getDisposalTypeConfig(type: DisposalType) {
  const configs: Record<DisposalType, { label: string; bgColor: string; textColor: string }> = {
    RELEASE: { label: "合格放行", bgColor: "bg-green-100", textColor: "text-green-800" },
    DETAIN: { label: "扣留", bgColor: "bg-red-100", textColor: "text-red-800" },
    RE_TEST: { label: "补检", bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
    APPEAL: { label: "复议", bgColor: "bg-purple-100", textColor: "text-purple-800" },
  };
  return configs[type] || { label: type, bgColor: "bg-gray-100", textColor: "text-gray-800" };
}

function getAbnormalTypeConfig(type: AbnormalType) {
  const configs: Record<AbnormalType, { label: string; bgColor: string; textColor: string }> = {
    NONE: { label: "正常", bgColor: "bg-green-100", textColor: "text-green-800" },
    SEAL_DAMAGED: { label: "封签破损", bgColor: "bg-red-100", textColor: "text-red-800" },
    MISSING_TEST_ITEMS: { label: "漏检项目", bgColor: "bg-orange-100", textColor: "text-orange-800" },
    TEST_FAILED: { label: "检测不合格", bgColor: "bg-red-100", textColor: "text-red-800" },
    CONCLUSION_APPEAL: { label: "结论复议", bgColor: "bg-purple-100", textColor: "text-purple-800" },
    OTHER: { label: "其他异常", bgColor: "bg-gray-100", textColor: "text-gray-800" },
  };
  return configs[type] || { label: type, bgColor: "bg-gray-100", textColor: "text-gray-800" };
}

function getRoleConfig(role: UserRole) {
  const configs: Record<UserRole, { label: string; bgColor: string; textColor: string }> = {
    INSPECTION_OFFICER: { label: "查验关员", bgColor: "bg-blue-100", textColor: "text-blue-800" },
    LAB_TECHNICIAN: { label: "实验室人员", bgColor: "bg-purple-100", textColor: "text-purple-800" },
    DISPOSAL_REVIEWER: { label: "处置复核人", bgColor: "bg-green-100", textColor: "text-green-800" },
  };
  return configs[role] || { label: role, bgColor: "bg-gray-100", textColor: "text-gray-800" };
}
