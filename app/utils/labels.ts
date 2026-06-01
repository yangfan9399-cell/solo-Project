type UserRole = "ADMIN" | "SOCIAL_WORKER" | "MANAGER";

export function getRoleName(role: UserRole): string {
  const roleMap: Record<UserRole, string> = {
    ADMIN: "物资管理员",
    SOCIAL_WORKER: "项目社工",
    MANAGER: "机构负责人",
  };
  return roleMap[role];
}

export const donationStatusLabels: Record<string, string> = {
  PENDING: "待接收",
  INSPECTING: "质检中",
  APPROVED: "已质检",
  REJECTED: "质检不通过",
  STORED: "已入库",
};

export const applicationStatusLabels: Record<string, string> = {
  PENDING: "待审批",
  APPROVED: "已批准",
  REJECTED: "已拒绝",
  DISTRIBUTED: "已发放",
  CANCELLED: "已取消",
};

export const distributionStatusLabels: Record<string, string> = {
  PREPARING: "准备中",
  SHIPPED: "已出库",
  DELIVERED: "已送达",
  SIGNED: "已签收",
  CANCELLED: "已取消",
};

export const exceptionStatusLabels: Record<string, string> = {
  OPEN: "待处理",
  PROCESSING: "处理中",
  RESOLVED: "已解决",
  CLOSED: "已关闭",
};

export const exceptionTypeLabels: Record<string, string> = {
  QUALITY_ISSUE: "质量问题",
  QUANTITY_MISMATCH: "数量不符",
  DAMAGE: "损坏",
  LOSS: "丢失",
  OTHER: "其他",
};
