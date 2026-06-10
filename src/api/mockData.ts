export interface Claim {
  id: number
  batchNumber: string | null
  partNumber: string | null
  partName: string | null
  categoryName: string | null
  supplierName: string | null
  defectType: string | null
  quantityDefective: number
  claimAmount: string
  description: string | null
  status: string | null
  batchTraceable: boolean | null
  repairDeadline: string | null
  repairCompleted: boolean | null
  engineerName: string | null
  createdAt: string | null
}

export interface ClaimDetail extends Claim {
  updatedAt: string | null
  evidences: Array<{
    id: number
    type: string | null
    url: string | null
    description: string | null
    uploadedAt: string | null
  }>
  history: Array<{
    id: number
    status: string
    comment: string | null
    operator: string | null
    createdAt: string | null
  }>
  supplierResponse: {
    responseType: string
    comment: string | null
    evidenceUrl: string | null
    createdAt: string | null
  } | null
}

export const mockClaims: Claim[] = [
  {
    id: 1,
    batchNumber: 'B202401001',
    partNumber: 'ENG-001',
    partName: '凸轮轴',
    categoryName: '发动机部件',
    supplierName: '上海精密机械有限公司',
    defectType: '尺寸偏差',
    quantityDefective: 15,
    claimAmount: '12750.00',
    description: '凸轮轴尺寸超出公差范围，影响装配精度',
    status: 'completed',
    batchTraceable: true,
    repairDeadline: '2024-02-10T00:00:00.000Z',
    repairCompleted: true,
    engineerName: '赵工程师',
    createdAt: '2024-01-28T00:00:00.000Z'
  },
  {
    id: 2,
    batchNumber: 'B202402001',
    partNumber: 'CHS-001',
    partName: '减震器',
    categoryName: '底盘系统',
    supplierName: '广州汽车零部件有限公司',
    defectType: '表面缺陷',
    quantityDefective: 8,
    claimAmount: '3040.00',
    description: '减震器表面存在明显划痕，影响产品外观',
    status: 'supplier_response',
    batchTraceable: true,
    repairDeadline: '2024-03-01T00:00:00.000Z',
    repairCompleted: false,
    engineerName: '孙工程师',
    createdAt: '2024-02-25T00:00:00.000Z'
  },
  {
    id: 3,
    batchNumber: 'B202403001',
    partNumber: 'ELC-001',
    partName: '传感器',
    categoryName: '电子元件',
    supplierName: '武汉金属制品有限公司',
    defectType: '材料缺陷',
    quantityDefective: 25,
    claimAmount: '7000.00',
    description: '传感器材料性能不达标，导致信号不稳定',
    status: 'under_review',
    batchTraceable: false,
    repairCompleted: false,
    engineerName: '周工程师',
    createdAt: '2024-03-20T00:00:00.000Z'
  },
  {
    id: 4,
    batchNumber: 'B202404001',
    partNumber: 'ENG-002',
    partName: '活塞环',
    categoryName: '发动机部件',
    supplierName: '成都电子科技有限公司',
    defectType: '功能故障',
    quantityDefective: 40,
    claimAmount: '4800.00',
    description: '活塞环安装后无法正常工作，导致发动机异响',
    status: 'under_review',
    batchTraceable: true,
    repairDeadline: '2024-04-20T00:00:00.000Z',
    repairCompleted: false,
    engineerName: '吴工程师',
    createdAt: '2024-04-12T00:00:00.000Z'
  }
]

export const mockClaimDetails: Record<number, ClaimDetail> = {
  1: {
    ...mockClaims[0],
    updatedAt: '2024-02-10T00:00:00.000Z',
    evidences: [
      { id: 1, type: '检测报告', url: '/evidence/report1.pdf', description: '第三方检测机构出具的尺寸检测报告', uploadedAt: '2024-01-29T00:00:00.000Z' },
      { id: 2, type: '照片', url: '/evidence/photo1.jpg', description: '缺陷部位实拍照片', uploadedAt: '2024-01-29T00:00:00.000Z' }
    ],
    history: [
      { id: 1, status: 'pending', comment: '质量工程师登记问题', operator: '赵工程师', createdAt: '2024-01-28T00:00:00.000Z' },
      { id: 2, status: 'supplier_notified', comment: '采购已联系供应商', operator: '采购部', createdAt: '2024-01-29T00:00:00.000Z' },
      { id: 3, status: 'supplier_response', comment: '供应商确认问题', operator: '系统', createdAt: '2024-02-01T00:00:00.000Z' },
      { id: 4, status: 'under_review', comment: '进入财务复核', operator: '财务部', createdAt: '2024-02-05T00:00:00.000Z' },
      { id: 5, status: 'approved', comment: '索赔金额已确认', operator: '财务部', createdAt: '2024-02-08T00:00:00.000Z' },
      { id: 6, status: 'payment_processing', comment: '扣款处理中', operator: '财务部', createdAt: '2024-02-09T00:00:00.000Z' },
      { id: 7, status: 'completed', comment: '扣款完成', operator: '财务部', createdAt: '2024-02-10T00:00:00.000Z' }
    ],
    supplierResponse: null
  },
  2: {
    ...mockClaims[1],
    updatedAt: '2024-02-28T00:00:00.000Z',
    evidences: [
      { id: 3, type: '照片', url: '/evidence/photo2.jpg', description: '减震器表面划痕照片', uploadedAt: '2024-02-26T00:00:00.000Z' }
    ],
    history: [
      { id: 8, status: 'pending', comment: '质量工程师登记问题', operator: '孙工程师', createdAt: '2024-02-25T00:00:00.000Z' },
      { id: 9, status: 'supplier_notified', comment: '采购已联系供应商', operator: '采购部', createdAt: '2024-02-26T00:00:00.000Z' },
      { id: 10, status: 'supplier_response', comment: '供应商提出反驳', operator: '系统', createdAt: '2024-02-28T00:00:00.000Z' }
    ],
    supplierResponse: {
      responseType: 'reject',
      comment: '划痕为运输过程中造成，非我方责任，附有物流证明',
      evidenceUrl: '/evidence/logistics.pdf',
      createdAt: '2024-02-28T00:00:00.000Z'
    }
  },
  3: {
    ...mockClaims[2],
    updatedAt: '2024-03-25T00:00:00.000Z',
    evidences: [
      { id: 4, type: '检测报告', url: '/evidence/report2.pdf', description: '材料成分分析报告', uploadedAt: '2024-03-21T00:00:00.000Z' }
    ],
    history: [
      { id: 11, status: 'pending', comment: '质量工程师登记问题', operator: '周工程师', createdAt: '2024-03-20T00:00:00.000Z' },
      { id: 12, status: 'supplier_notified', comment: '采购已联系供应商', operator: '采购部', createdAt: '2024-03-21T00:00:00.000Z' },
      { id: 13, status: 'under_review', comment: '批次追溯失败，需补充证据', operator: '财务部', createdAt: '2024-03-25T00:00:00.000Z' }
    ],
    supplierResponse: null
  },
  4: {
    ...mockClaims[3],
    updatedAt: '2024-04-21T00:00:00.000Z',
    evidences: [
      { id: 5, type: '视频', url: '/evidence/video1.mp4', description: '发动机异响视频记录', uploadedAt: '2024-04-13T00:00:00.000Z' }
    ],
    history: [
      { id: 14, status: 'pending', comment: '质量工程师登记问题', operator: '吴工程师', createdAt: '2024-04-12T00:00:00.000Z' },
      { id: 15, status: 'supplier_notified', comment: '采购已联系供应商', operator: '采购部', createdAt: '2024-04-13T00:00:00.000Z' },
      { id: 16, status: 'supplier_response', comment: '供应商同意返修', operator: '系统', createdAt: '2024-04-15T00:00:00.000Z' },
      { id: 17, status: 'under_review', comment: '返修超期，待处理', operator: '财务部', createdAt: '2024-04-21T00:00:00.000Z' }
    ],
    supplierResponse: {
      responseType: 'accept',
      comment: '同意返修方案，正在安排人员处理',
      evidenceUrl: null,
      createdAt: '2024-04-15T00:00:00.000Z'
    }
  }
}

export const mockSupplierSummary = [
  { supplierId: 1, supplierName: '上海精密机械有限公司', claimCount: 1, totalAmount: 12750, avgAmount: 12750 },
  { supplierId: 2, supplierName: '广州汽车零部件有限公司', claimCount: 1, totalAmount: 3040, avgAmount: 3040 },
  { supplierId: 3, supplierName: '武汉金属制品有限公司', claimCount: 1, totalAmount: 7000, avgAmount: 7000 },
  { supplierId: 4, supplierName: '成都电子科技有限公司', claimCount: 1, totalAmount: 4800, avgAmount: 4800 }
]

export const mockCategorySummary = [
  { categoryId: 1, categoryName: '发动机部件', claimCount: 2, totalAmount: 17550 },
  { categoryId: 2, categoryName: '底盘系统', claimCount: 1, totalAmount: 3040 },
  { categoryId: 3, categoryName: '电子元件', claimCount: 1, totalAmount: 7000 },
  { categoryId: 4, categoryName: '车身覆盖件', claimCount: 0, totalAmount: 0 }
]

export const mockDefectTypeSummary = [
  { defectTypeId: 1, defectTypeName: '尺寸偏差', claimCount: 1, totalAmount: 12750 },
  { defectTypeId: 2, defectTypeName: '表面缺陷', claimCount: 1, totalAmount: 3040 },
  { defectTypeId: 3, defectTypeName: '材料缺陷', claimCount: 1, totalAmount: 7000 },
  { defectTypeId: 4, defectTypeName: '装配不良', claimCount: 0, totalAmount: 0 },
  { defectTypeId: 5, defectTypeName: '功能故障', claimCount: 1, totalAmount: 4800 }
]

export const mockPeriodSummary = [
  { period: '2024-01', claimCount: 1, totalAmount: 12750 },
  { period: '2024-02', claimCount: 1, totalAmount: 3040 },
  { period: '2024-03', claimCount: 1, totalAmount: 7000 },
  { period: '2024-04', claimCount: 1, totalAmount: 4800 }
]

export const mockDashboardStats = {
  totalClaims: 4,
  totalAmount: 27590,
  pendingCount: 0,
  underReviewCount: 2,
  completedCount: 1
}
