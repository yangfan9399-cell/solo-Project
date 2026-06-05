export type OrderStatus = 
  | 'PENDING'
  | 'DOCUMENTS_INCOMPLETE'
  | 'INVOICE_MISMATCH'
  | 'CLASSIFICATION_CONFLICT'
  | 'ID_MISSING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export type DocumentStatus = 'COMPLETE' | 'INCOMPLETE' | 'PENDING_REVIEW';

export interface OrderItem {
  id: string;
  name: string;
  declaredName: string;
  hsCode: string | null;
  declaredHsCode: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  weight: number | null;
  classificationNote: string | null;
}

export interface Document {
  id: string;
  type: string;
  name: string;
  status: string;
  notes: string | null;
  uploadedBy: string | null;
}

export interface HistoryNode {
  id: string;
  action: string;
  status: string;
  notes: string | null;
  operator: string;
  role: string;
  timestamp: string;
}

export interface AmountDiscrepancy {
  id: string;
  declaredAmount: number;
  actualAmount: number;
  difference: number;
  differencePercent: number;
  discrepancySource: string;
  correctionPath: string;
  resolved: boolean;
}

export interface ClassificationNote {
  id: string;
  itemName: string;
  declaredHsCode: string;
  suggestedHsCode: string;
  reason: string;
  status: string;
  resolved: boolean;
}

export interface ClearanceBasis {
  id: string;
  basisType: string;
  regulationReference: string | null;
  explanation: string | null;
  approvedBy: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  source: string;
  sourceOrderNo: string | null;
  country: string;
  category: string;
  declaredValue: number;
  actualValue: number | null;
  declaredAmount: number;
  actualAmount: number | null;
  recipientName: string;
  recipientIdType: string | null;
  recipientIdNumber: string | null;
  trackingNumber: string | null;
  status: OrderStatus;
  documentStatus: DocumentStatus;
  items: OrderItem[];
  documents: Document[];
  historyNodes: HistoryNode[];
  amountDiscrepancy: AmountDiscrepancy | null;
  classificationNote: ClassificationNote | null;
  clearanceBasis: ClearanceBasis | null;
  documentHandlerName: string | null;
  customsReviewerName: string | null;
  createdAt: string;
}

export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'CC20240601001',
    source: '亚马逊美国',
    sourceOrderNo: 'AMZ-US-2024-001234',
    country: '美国',
    category: '电子产品',
    declaredValue: 1500.00,
    actualValue: 1500.00,
    declaredAmount: 1500.00,
    actualAmount: 1500.00,
    recipientName: '王小明',
    recipientIdType: '身份证',
    recipientIdNumber: '310101199001011234',
    trackingNumber: 'SF1234567890',
    status: 'UNDER_REVIEW',
    documentStatus: 'COMPLETE',
    documentHandlerName: '张伟',
    customsReviewerName: '李明',
    items: [
      {
        id: '1-1',
        name: '苹果 iPhone 15 Pro',
        declaredName: '智能手机',
        hsCode: '85171210',
        declaredHsCode: '85171210',
        quantity: 1,
        unitPrice: 999.00,
        total: 999.00,
        weight: 0.21,
        classificationNote: null,
      },
      {
        id: '1-2',
        name: 'AirPods Pro 2',
        declaredName: '无线耳机',
        hsCode: '85176290',
        declaredHsCode: '85176290',
        quantity: 1,
        unitPrice: 249.00,
        total: 249.00,
        weight: 0.05,
        classificationNote: null,
      },
    ],
    documents: [
      { id: 'd1', type: 'COMMERCIAL_INVOICE', name: '商业发票.pdf', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
      { id: 'd2', type: 'PACKING_LIST', name: '装箱单.pdf', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
      { id: 'd3', type: 'SHIPPING_LABEL', name: '运单.pdf', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
      { id: 'd4', type: 'ID_CARD', name: '收件人身份证.jpg', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
    ],
    historyNodes: [
      { id: 'h1', action: '订单创建', status: 'PENDING', notes: null, operator: '系统', role: 'SYSTEM', timestamp: '2024-06-01T09:00:00' },
      { id: 'h2', action: '资料上传', status: 'DOCUMENTS_INCOMPLETE', notes: null, operator: '张伟', role: '单证经办人', timestamp: '2024-06-01T10:30:00' },
      { id: 'h3', action: '资料审核通过', status: 'UNDER_REVIEW', notes: '所有单证齐全，提交关务复核', operator: '张伟', role: '单证经办人', timestamp: '2024-06-01T14:00:00' },
    ],
    amountDiscrepancy: null,
    classificationNote: null,
    clearanceBasis: {
      id: 'cb1',
      basisType: '个人物品清关',
      regulationReference: '海关总署公告2010年第43号',
      explanation: '该订单符合个人自用物品标准，总价值在免税额度内',
      approvedBy: null,
    },
    createdAt: '2024-06-01T09:00:00',
  },
  {
    id: '2',
    orderNumber: 'CC20240601002',
    source: 'eBay德国',
    sourceOrderNo: 'EBY-DE-2024-987654',
    country: '德国',
    category: '家居用品',
    declaredValue: 800.00,
    actualValue: 1200.00,
    declaredAmount: 800.00,
    actualAmount: 1200.00,
    recipientName: '陈小红',
    recipientIdType: '身份证',
    recipientIdNumber: '440301199203156789',
    trackingNumber: 'DHL9876543210',
    status: 'INVOICE_MISMATCH',
    documentStatus: 'COMPLETE',
    documentHandlerName: '张伟',
    customsReviewerName: null,
    items: [
      {
        id: '2-1',
        name: '双立人刀具套装',
        declaredName: '厨房刀具',
        hsCode: '82149000',
        declaredHsCode: '82149000',
        quantity: 1,
        unitPrice: 800.00,
        total: 800.00,
        weight: 2.5,
        classificationNote: null,
      },
    ],
    documents: [
      { id: 'd5', type: 'COMMERCIAL_INVOICE', name: '商业发票.pdf', status: 'MISMATCH', notes: '发票金额与申报金额不符', uploadedBy: '张伟' },
      { id: 'd6', type: 'PACKING_LIST', name: '装箱单.pdf', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
      { id: 'd7', type: 'SHIPPING_LABEL', name: '运单.pdf', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
      { id: 'd8', type: 'ID_CARD', name: '收件人身份证.jpg', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
    ],
    historyNodes: [
      { id: 'h4', action: '订单创建', status: 'PENDING', notes: null, operator: '系统', role: 'SYSTEM', timestamp: '2024-06-01T10:00:00' },
      { id: 'h5', action: '资料上传', status: 'DOCUMENTS_INCOMPLETE', notes: null, operator: '张伟', role: '单证经办人', timestamp: '2024-06-01T11:00:00' },
      { id: 'h6', action: '发票金额不符', status: 'INVOICE_MISMATCH', notes: '申报800欧元，实际发票1200欧元', operator: '张伟', role: '单证经办人', timestamp: '2024-06-01T15:00:00' },
    ],
    amountDiscrepancy: {
      id: 'ad1',
      declaredAmount: 800.00,
      actualAmount: 1200.00,
      difference: 400.00,
      differencePercent: 50.0,
      discrepancySource: '发票金额与申报金额差异',
      correctionPath: '1. 联系发件人确认真实交易金额; 2. 重新提供正确商业发票; 3. 更新申报金额后重新提交',
      resolved: false,
    },
    classificationNote: null,
    clearanceBasis: null,
    createdAt: '2024-06-01T10:00:00',
  },
  {
    id: '3',
    orderNumber: 'CC20240601003',
    source: '天猫国际',
    sourceOrderNo: 'TMALL-HK-2024-555555',
    country: '香港',
    category: '保健品',
    declaredValue: 680.00,
    actualValue: 680.00,
    declaredAmount: 680.00,
    actualAmount: 680.00,
    recipientName: '刘建国',
    recipientIdType: '身份证',
    recipientIdNumber: '320101198508084321',
    trackingNumber: 'SF5556667777',
    status: 'CLASSIFICATION_CONFLICT',
    documentStatus: 'PENDING_REVIEW',
    documentHandlerName: '张伟',
    customsReviewerName: null,
    items: [
      {
        id: '3-1',
        name: 'Swisse 胶原蛋白片',
        declaredName: '膳食补充剂',
        hsCode: '21069090',
        declaredHsCode: '30049090',
        quantity: 3,
        unitPrice: 226.67,
        total: 680.00,
        weight: 0.8,
        classificationNote: '需确认归类：药品vs食品补充剂',
      },
    ],
    documents: [
      { id: 'd9', type: 'COMMERCIAL_INVOICE', name: '商业发票.pdf', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
      { id: 'd10', type: 'PACKING_LIST', name: '装箱单.pdf', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
      { id: 'd11', type: 'SHIPPING_LABEL', name: '运单.pdf', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
      { id: 'd12', type: 'ID_CARD', name: '收件人身份证.jpg', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
      { id: 'd13', type: 'PRODUCT_DESC', name: '产品说明书.pdf', status: 'PENDING', notes: null, uploadedBy: '张伟' },
    ],
    historyNodes: [
      { id: 'h7', action: '订单创建', status: 'PENDING', notes: null, operator: '系统', role: 'SYSTEM', timestamp: '2024-06-01T11:00:00' },
      { id: 'h8', action: '资料上传', status: 'DOCUMENTS_INCOMPLETE', notes: null, operator: '张伟', role: '单证经办人', timestamp: '2024-06-01T12:00:00' },
      { id: 'h9', action: '归类冲突', status: 'CLASSIFICATION_CONFLICT', notes: '申报品名为药品，实际为保健品', operator: '张伟', role: '单证经办人', timestamp: '2024-06-01T16:00:00' },
    ],
    amountDiscrepancy: null,
    classificationNote: {
      id: 'cn1',
      itemName: 'Swisse 胶原蛋白片',
      declaredHsCode: '30049090',
      suggestedHsCode: '21069090',
      reason: '该产品为膳食营养补充剂，不属于药品范畴，应归入食品补充剂类',
      status: 'PENDING',
      resolved: false,
    },
    clearanceBasis: null,
    createdAt: '2024-06-01T11:00:00',
  },
  {
    id: '4',
    orderNumber: 'CC20240601004',
    source: 'Shopee新加坡',
    sourceOrderNo: 'SGP-SG-2024-111222',
    country: '新加坡',
    category: '服装配饰',
    declaredValue: 350.00,
    actualValue: 350.00,
    declaredAmount: 350.00,
    actualAmount: 350.00,
    recipientName: '赵美玲',
    recipientIdType: '身份证',
    recipientIdNumber: null,
    trackingNumber: 'SG111222333',
    status: 'ID_MISSING',
    documentStatus: 'INCOMPLETE',
    documentHandlerName: '张伟',
    customsReviewerName: null,
    items: [
      {
        id: '4-1',
        name: 'Charles & Keith 手提包',
        declaredName: '女士手提包',
        hsCode: '42022100',
        declaredHsCode: '42022100',
        quantity: 1,
        unitPrice: 350.00,
        total: 350.00,
        weight: 0.6,
        classificationNote: null,
      },
    ],
    documents: [
      { id: 'd14', type: 'COMMERCIAL_INVOICE', name: '商业发票.pdf', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
      { id: 'd15', type: 'PACKING_LIST', name: '装箱单.pdf', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
      { id: 'd16', type: 'SHIPPING_LABEL', name: '运单.pdf', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
      { id: 'd17', type: 'ID_CARD', name: '收件人身份证.jpg', status: 'MISSING', notes: '收件人身份证件缺失，需补传', uploadedBy: null },
    ],
    historyNodes: [
      { id: 'h10', action: '订单创建', status: 'PENDING', notes: null, operator: '系统', role: 'SYSTEM', timestamp: '2024-06-01T12:00:00' },
      { id: 'h11', action: '资料上传', status: 'DOCUMENTS_INCOMPLETE', notes: null, operator: '张伟', role: '单证经办人', timestamp: '2024-06-01T13:00:00' },
      { id: 'h12', action: '证件缺失', status: 'ID_MISSING', notes: '收件人身份证照片缺失，已通知收件人', operator: '张伟', role: '单证经办人', timestamp: '2024-06-01T17:00:00' },
    ],
    amountDiscrepancy: null,
    classificationNote: null,
    clearanceBasis: null,
    createdAt: '2024-06-01T12:00:00',
  },
  {
    id: '5',
    orderNumber: 'CC20240501005',
    source: '亚马逊日本',
    sourceOrderNo: 'AMZ-JP-2024-888888',
    country: '日本',
    category: '图书音像',
    declaredValue: 450.00,
    actualValue: 450.00,
    declaredAmount: 450.00,
    actualAmount: 450.00,
    recipientName: '孙文华',
    recipientIdType: '身份证',
    recipientIdNumber: '110101197812125555',
    trackingNumber: 'JP8888888888',
    status: 'ARCHIVED',
    documentStatus: 'COMPLETE',
    documentHandlerName: '张伟',
    customsReviewerName: '李明',
    items: [
      {
        id: '5-1',
        name: '村上春树作品集',
        declaredName: '书籍',
        hsCode: '49019900',
        declaredHsCode: '49019900',
        quantity: 5,
        unitPrice: 90.00,
        total: 450.00,
        weight: 1.2,
        classificationNote: null,
      },
    ],
    documents: [
      { id: 'd18', type: 'COMMERCIAL_INVOICE', name: '商业发票.pdf', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
      { id: 'd19', type: 'PACKING_LIST', name: '装箱单.pdf', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
      { id: 'd20', type: 'SHIPPING_LABEL', name: '运单.pdf', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
      { id: 'd21', type: 'ID_CARD', name: '收件人身份证.jpg', status: 'VERIFIED', notes: null, uploadedBy: '张伟' },
    ],
    historyNodes: [
      { id: 'h13', action: '订单创建', status: 'PENDING', notes: null, operator: '系统', role: 'SYSTEM', timestamp: '2024-05-01T10:00:00' },
      { id: 'h14', action: '资料上传', status: 'DOCUMENTS_INCOMPLETE', notes: null, operator: '张伟', role: '单证经办人', timestamp: '2024-05-01T11:30:00' },
      { id: 'h15', action: '资料审核通过', status: 'UNDER_REVIEW', notes: null, operator: '张伟', role: '单证经办人', timestamp: '2024-05-01T14:00:00' },
      { id: 'h16', action: '放行通过', status: 'APPROVED', notes: '单证齐全，准予放行', operator: '李明', role: '关务复核人', timestamp: '2024-05-01T16:30:00' },
      { id: 'h17', action: '归档', status: 'ARCHIVED', notes: null, operator: '系统', role: 'SYSTEM', timestamp: '2024-05-05T09:00:00' },
    ],
    amountDiscrepancy: null,
    classificationNote: null,
    clearanceBasis: {
      id: 'cb2',
      basisType: '图书免税政策',
      regulationReference: '海关总署令第161号',
      explanation: '进口图书符合免税政策，已办理免税手续',
      approvedBy: '李明',
    },
    createdAt: '2024-05-01T10:00:00',
  },
];

export function getOrders(): Order[] {
  return mockOrders;
}

export function getOrderById(id: string): Order | undefined {
  return mockOrders.find(o => o.id === id);
}

export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    PENDING: '待处理',
    DOCUMENTS_INCOMPLETE: '资料不全',
    INVOICE_MISMATCH: '发票金额不符',
    CLASSIFICATION_CONFLICT: '品名归类冲突',
    ID_MISSING: '收件人证件缺失',
    UNDER_REVIEW: '关务复核中',
    APPROVED: '已放行',
    REJECTED: '已退回',
    ARCHIVED: '已归档',
  };
  return labels[status];
}

export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    PENDING: 'bg-gray-100 text-gray-800',
    DOCUMENTS_INCOMPLETE: 'bg-yellow-100 text-yellow-800',
    INVOICE_MISMATCH: 'bg-red-100 text-red-800',
    CLASSIFICATION_CONFLICT: 'bg-orange-100 text-orange-800',
    ID_MISSING: 'bg-purple-100 text-purple-800',
    UNDER_REVIEW: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    ARCHIVED: 'bg-gray-100 text-gray-600',
  };
  return colors[status];
}

export function getDocumentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    COMMERCIAL_INVOICE: '商业发票',
    PACKING_LIST: '装箱单',
    SHIPPING_LABEL: '运单',
    ID_CARD: '身份证件',
    PRODUCT_DESC: '产品说明',
  };
  return labels[type] || type;
}

export function getDocumentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    VERIFIED: '已审核',
    PENDING: '待审核',
    MISSING: '缺失',
    MISMATCH: '不符',
  };
  return labels[status] || status;
}
