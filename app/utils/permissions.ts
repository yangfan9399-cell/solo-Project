export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredLevel?: number;
  currentLevel?: number;
  escalateTo?: string;
}

export function checkPermission(
  userPermissionLevel: number,
  requiredPermissionLevel: number
): PermissionCheckResult {
  if (userPermissionLevel >= requiredPermissionLevel) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `权限等级不足。您当前等级为 Lv.${userPermissionLevel}，需要 Lv.${requiredPermissionLevel} 才能领用该试剂。`,
    requiredLevel: requiredPermissionLevel,
    currentLevel: userPermissionLevel,
    escalateTo: "请申请升级审批至更高权限等级的安全员审批人审批。",
  };
}

export function getPermissionLevelName(level: number): string {
  const names: Record<number, string> = {
    1: "一级（普通实验员）",
    2: "二级（高级实验员）",
    3: "三级（实验室管理员）",
    4: "四级（安全员）",
    5: "五级（安全主任）",
  };
  return names[level] || `Lv.${level}`;
}

export function getHazardLevelName(level: string): { label: string; color: string } {
  const levels: Record<string, { label: string; color: string }> = {
    low: { label: "低危", color: "bg-green-100 text-green-800" },
    medium: { label: "中危", color: "bg-yellow-100 text-yellow-800" },
    high: { label: "高危", color: "bg-orange-100 text-orange-800" },
    extreme: { label: "极危", color: "bg-red-100 text-red-800" },
  };
  return levels[level] || { label: level, color: "bg-gray-100 text-gray-800" };
}

export function getStatusInfo(status: string): { label: string; color: string } {
  const statuses: Record<string, { label: string; color: string }> = {
    pending: { label: "待审批", color: "bg-blue-100 text-blue-800" },
    lab_approved: { label: "实验室已核验", color: "bg-indigo-100 text-indigo-800" },
    lab_rejected: { label: "实验室拒绝", color: "bg-red-100 text-red-800" },
    safety_approved: { label: "安全员已批准", color: "bg-green-100 text-green-800" },
    safety_rejected: { label: "安全员拒绝", color: "bg-red-100 text-red-800" },
    picked_up: { label: "已领取", color: "bg-purple-100 text-purple-800" },
    returned: { label: "已归还", color: "bg-gray-100 text-gray-800" },
    overdue: { label: "逾期未还", color: "bg-red-100 text-red-800" },
    escalated: { label: "升级审批中", color: "bg-orange-100 text-orange-800" },
  };
  return statuses[status] || { label: status, color: "bg-gray-100 text-gray-800" };
}

export function getRoleName(role: string): string {
  const roles: Record<string, string> = {
    experimenter: "实验员",
    lab_admin: "实验室管理员",
    safety_officer: "安全员",
  };
  return roles[role] || role;
}
