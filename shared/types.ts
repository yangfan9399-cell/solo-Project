export type PaymentChannel = 'wechat' | 'alipay' | 'bank_card';
export type ExceptionType = 'normal' | 'duplicate_deduction' | 'paid_not_credited' | 'refund_failed';
export type CreditStatus = 'credited' | 'not_credited' | 'partially_credited';
export type RecordStatus = 'pending' | 'verifying' | 'refund_submitted' | 'supplement_submitted' | 'reviewing' | 'returned' | 'completed';
export type OperatorRole = 'handler' | 'reviewer';
export type HistoryAction = 'created' | 'verified' | 'refund_submitted' | 'supplement_submitted' | 'review_confirmed' | 'returned_for_evidence' | 'evidence_supplemented' | 'completed';

export interface ExceptionRecord {
  id: string;
  card_no: string;
  holder_name: string;
  amount: number;
  payment_channel: PaymentChannel;
  payment_transaction_no: string;
  transaction_time: string;
  exception_type: ExceptionType;
  credit_status: CreditStatus;
  credit_time: string | null;
  refund_basis: string | null;
  refund_amount: number | null;
  refund_account: string | null;
  responsible_person: string;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
}

export interface ProcessingHistory {
  id: string;
  exception_id: string;
  operator: string;
  operator_role: OperatorRole;
  action: HistoryAction;
  remark: string;
  created_at: string;
}

export interface ExceptionDetail extends ExceptionRecord {
  histories: ProcessingHistory[];
}

export interface AggregateStats {
  byExceptionType: { type: string; count: number; totalAmount: number }[];
  byPaymentChannel: { channel: string; count: number; totalAmount: number }[];
  processingTime: { type: string; avgHours: number; maxHours: number; minHours: number }[];
  refundResult: { result: string; count: number; totalAmount: number }[];
}

export interface ExceptionListResponse {
  data: ExceptionRecord[];
  total: number;
}

export const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
  normal: '到账正常',
  duplicate_deduction: '重复扣款',
  paid_not_credited: '支付成功未入账',
  refund_failed: '退款失败',
};

export const PAYMENT_CHANNEL_LABELS: Record<PaymentChannel, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  bank_card: '银行卡',
};

export const CREDIT_STATUS_LABELS: Record<CreditStatus, string> = {
  credited: '已入账',
  not_credited: '未入账',
  partially_credited: '部分入账',
};

export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
  pending: '待核对',
  verifying: '核对中',
  refund_submitted: '退款已提交',
  supplement_submitted: '补记账已提交',
  reviewing: '复核中',
  returned: '已退回补证',
  completed: '已完成',
};

export const HISTORY_ACTION_LABELS: Record<HistoryAction, string> = {
  created: '创建异常记录',
  verified: '核对确认',
  refund_submitted: '提交退款申请',
  supplement_submitted: '提交补记账申请',
  review_confirmed: '复核确认',
  returned_for_evidence: '退回补充证据',
  evidence_supplemented: '补充证据',
  completed: '处理完成',
};
