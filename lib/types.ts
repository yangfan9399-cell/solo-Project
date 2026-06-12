import {
  OrderStatus,
  NodeType,
  DifferenceType,
  SampleCategory,
  UserRole,
} from "@prisma/client";
import type {
  DispatchOrder,
  OrderNode,
  FieldDifference,
  ReviewRecord,
  OrderAttachment,
} from "@prisma/client";

export {
  OrderStatus,
  NodeType,
  DifferenceType,
  SampleCategory,
  UserRole,
};
export type {
  DispatchOrder,
  OrderNode,
  FieldDifference,
  ReviewRecord,
  OrderAttachment,
};

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface DispatchOrderWithRelations extends DispatchOrder {
  nodes: OrderNode[];
  attachments: OrderAttachment[];
  differences: FieldDifference[];
  reviewRecords: ReviewRecord[];
}

export interface OrderSummary {
  id: string;
  orderNo: string;
  title: string;
  status: OrderStatus;
  sampleCategory: SampleCategory | null;
  reservoirName: string;
  gateNo: string;
  responsibleUnit: string;
  responsiblePerson: string;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  summary: string | null;
  conclusion: string | null;
  currentNodeId: string | null;
  blockReason: string | null;
  remedyPath: string | null;
}

export interface DashboardStats {
  total: number;
  pending: number;
  processing: number;
  reviewing: number;
  approved: number;
  rejected: number;
  archived: number;
  byCategory: Record<SampleCategory, number>;
  byMonth: { month: string; count: number }[];
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_ACCEPT: "待受理",
  PROCESSING: "处理中",
  PENDING_REVIEW: "待复核",
  REVIEW_APPROVED: "复核通过",
  REVIEW_REJECTED: "复核退回",
  ARCHIVED: "已归档",
};

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  ACCEPT: "受理",
  ASSIGN: "分配",
  PROCESS: "处理",
  SUPPLEMENT: "补充材料",
  SUBMIT_REVIEW: "提交复核",
  REVIEW: "复核",
  REJECT: "退回",
  APPROVE: "通过",
  ARCHIVE: "归档",
  REOPEN: "重新处理",
};

export const DIFFERENCE_TYPE_LABELS: Record<DifferenceType, string> = {
  KEY_TIME: "关键时间",
  RESPONSIBLE_PARTY: "责任对象",
  AMOUNT: "金额数量",
  EVIDENCE_CONCLUSION: "证据结论",
  OTHER: "其他",
};

export const SAMPLE_CATEGORY_LABELS: Record<SampleCategory, string> = {
  NORMAL_CLOSE: "正常闭环",
  MISSING_MATERIAL: "关键材料缺失",
  INCONSISTENT_PARTY: "责任对象不一致",
  REVIEW_REJECTED: "复核退回",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  OPERATOR: "经办人",
  REVIEWER: "复核人",
  ADMIN: "管理员",
};

export const KEY_FIELDS = [
  { name: "planExecuteTime", label: "计划执行时间", type: DifferenceType.KEY_TIME },
  { name: "actualExecuteTime", label: "实际执行时间", type: DifferenceType.KEY_TIME },
  { name: "reviewTime", label: "复核时间", type: DifferenceType.KEY_TIME },
  { name: "responsibleUnit", label: "责任单位", type: DifferenceType.RESPONSIBLE_PARTY },
  { name: "responsiblePerson", label: "责任人", type: DifferenceType.RESPONSIBLE_PARTY },
  { name: "operatorId", label: "经办人", type: DifferenceType.RESPONSIBLE_PARTY },
  { name: "amount", label: "金额", type: DifferenceType.AMOUNT },
  { name: "targetOpening", label: "目标开度", type: DifferenceType.AMOUNT },
  { name: "actualOpening", label: "实际开度", type: DifferenceType.AMOUNT },
  { name: "targetFlow", label: "目标流量", type: DifferenceType.AMOUNT },
  { name: "actualFlow", label: "实际流量", type: DifferenceType.AMOUNT },
  { name: "conclusion", label: "结论", type: DifferenceType.EVIDENCE_CONCLUSION },
] as const;
