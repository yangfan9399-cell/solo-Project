export type AppStatus =
  | "received"
  | "processing"
  | "review"
  | "archived"
  | "returned"
  | "reprocessing";

export type NodeType =
  | "received"
  | "processing"
  | "review"
  | "archived"
  | "reprocessing"
  | "returned";

export type Role = "applicant" | "processor" | "reviewer";

export type SampleType =
  | "normal"
  | "missing_records"
  | "inconsistent_attachments"
  | "reprocessing";

export type ChangeType =
  | "time"
  | "responsible"
  | "amount"
  | "evidence_conclusion";

export const STATUS_LABELS: Record<AppStatus, string> = {
  received: "已受理",
  processing: "处理中",
  review: "复核中",
  archived: "已归档",
  returned: "退回补证",
  reprocessing: "重新处理",
};

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  received: "受理",
  processing: "处理",
  review: "复核",
  archived: "归档",
  reprocessing: "重新处理",
  returned: "退回补证",
};

export const SAMPLE_TYPE_LABELS: Record<SampleType, string> = {
  normal: "正常核销",
  missing_records: "记录漏填",
  inconsistent_attachments: "附件版本不一致",
  reprocessing: "重新处理",
};

export const RISK_LEVEL_LABELS: Record<string, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
};

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  time: "关键时间",
  responsible: "责任对象",
  amount: "金额数量",
  evidence_conclusion: "证据结论",
};

export const RECORD_TYPE_LABELS: Record<string, string> = {
  business_record: "业务记录",
  site_description: "现场说明",
  evidence_attachment: "证据附件",
};

export const ROLE_LABELS: Record<Role, string> = {
  applicant: "申请人",
  processor: "处理员",
  reviewer: "归档复核人",
};
