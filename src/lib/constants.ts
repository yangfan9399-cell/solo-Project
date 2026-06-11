import type { OrderStatus, ProductCategory, RejectReason, UserRole } from './schema';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  proof_uploaded: '打样已上传',
  customer_confirmed: '客户已确认',
  customer_rejected: '客户已拒绝',
  production_review: '生产复核中',
  order_placed: '已下单',
  order_returned: '已退回',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  proof_uploaded: 'bg-purple-100 text-purple-800',
  customer_confirmed: 'bg-green-100 text-green-800',
  customer_rejected: 'bg-red-100 text-red-800',
  production_review: 'bg-yellow-100 text-yellow-800',
  order_placed: 'bg-emerald-100 text-emerald-800',
  order_returned: 'bg-orange-100 text-orange-800',
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  business_card: '名片',
  flyer: '宣传单',
  brochure: '宣传画册',
  poster: '海报',
  packaging: '包装',
  booklet: '书刊',
};

export const REJECT_REASON_LABELS: Record<RejectReason, string> = {
  color_deviation: '颜色偏差',
  design_issue: '设计问题',
  content_error: '内容错误',
  other: '其他原因',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  sales: '业务员',
  designer: '设计师',
  customer: '客户',
  production_manager: '生产主管',
};

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
