export type UserRole = 'HANDLER' | 'REVIEWER' | 'APPROVER'
export type ClaimStatus = 'DRAFT' | 'MATERIALS_MISSING' | 'MATERIALS_SUPPLEMENTED' | 'UNDER_REVIEW' | 'LIABILITY_DISPUTE' | 'AMOUNT_EXCEEDED' | 'APPROVED' | 'PAID' | 'REJECTED' | 'ARCHIVED' | 'REOPENED'
export type DocumentStatus = 'PENDING' | 'RECEIVED' | 'REJECTED' | 'SUPPLEMENT_REQUIRED'
export type ReviewResult = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUPPLEMENT_REQUIRED' | 'DISPUTE'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar?: string
}

export interface Policy {
  id: string
  policyNo: string
  policyType: string
  insuredName: string
  insuredIdNo: string
  coverageAmount: number
  premium: number
  effectiveDate: string
  expiryDate: string
  beneficiary?: string
  remarks?: string
}

export interface Accident {
  id: string
  accidentType: string
  accidentDate: string
  accidentLocation: string
  description: string
  injuryLevel?: string
  damageAmount?: number
  policeReport?: string
  witness?: string
}

export interface Document {
  id: string
  claimId: string
  name: string
  type: string
  status: DocumentStatus
  receivedDate?: string
  remarks?: string
  required: boolean
  supplementReason?: string
}

export interface Calculation {
  id: string
  totalLoss: number
  deductible: number
  coverageRatio: number
  payableAmount: number
  limitExceeded: boolean
  limitAmount?: number
  calculationNote?: string
}

export interface Review {
  id: string
  claimId: string
  userId: string
  user?: User
  stage: string
  result: ReviewResult
  opinion?: string
  isLiabilityConfirmed: boolean
  createdAt: string
}

export interface HistoryNode {
  id: string
  claimId: string
  userId?: string
  user?: User
  action: string
  status: ClaimStatus
  remark?: string
  timestamp: string
}

export interface DisputeTerm {
  id: string
  claimId: string
  termClause: string
  termDescription: string
  disputeReason: string
  supplementPath: string
  isResolved: boolean
  resolutionNote?: string
}

export interface Claim {
  id: string
  claimNo: string
  status: ClaimStatus
  policyId: string
  policy?: Policy
  accidentId: string
  accident?: Accident
  calculationId?: string
  calculation?: Calculation
  handlerId?: string
  handler?: User
  reviewerId?: string
  reviewer?: User
  approverId?: string
  approver?: User
  description?: string
  isArchived: boolean
  archiveReason?: string
  archiveDate?: string
  previousConclusion?: string
  previousConclusionText?: string
  reopenedFrom?: string
  reopenReason?: string
  reopenDate?: string
  documents: Document[]
  reviews: Review[]
  historyNodes: HistoryNode[]
  disputeTerms: DisputeTerm[]
  createdAt: string
  updatedAt: string
}

export const mockUsers: User[] = [
  { id: 'user-handler-001', name: '张明', role: 'HANDLER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming' },
  { id: 'user-reviewer-001', name: '李华', role: 'REVIEWER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lihua' },
  { id: 'user-approver-001', name: '王芳', role: 'APPROVER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangfang' }
]

export const mockPolicies: Policy[] = [
  {
    id: 'pol-001',
    policyNo: 'POL-2024-001234',
    policyType: '机动车辆保险',
    insuredName: '陈强',
    insuredIdNo: '310101199001011234',
    coverageAmount: 500000,
    premium: 4500,
    effectiveDate: '2024-01-01',
    expiryDate: '2024-12-31',
    beneficiary: '陈强',
    remarks: '交强险+商业险全保'
  },
  {
    id: 'pol-002',
    policyNo: 'POL-2024-001235',
    policyType: '重大疾病保险',
    insuredName: '刘芳',
    insuredIdNo: '320101198505055678',
    coverageAmount: 300000,
    premium: 6800,
    effectiveDate: '2024-03-15',
    expiryDate: '2025-03-14',
    beneficiary: '配偶',
    remarks: '终身重疾险，保额30万'
  },
  {
    id: 'pol-003',
    policyNo: 'POL-2024-001236',
    policyType: '意外伤害保险',
    insuredName: '赵刚',
    insuredIdNo: '330101199210109012',
    coverageAmount: 200000,
    premium: 1200,
    effectiveDate: '2024-06-01',
    expiryDate: '2025-05-31',
    beneficiary: '法定受益人',
    remarks: '综合意外险'
  },
  {
    id: 'pol-004',
    policyNo: 'POL-2024-001237',
    policyType: '家庭财产保险',
    insuredName: '孙丽',
    insuredIdNo: '340101198808083456',
    coverageAmount: 100000,
    premium: 500,
    effectiveDate: '2024-02-01',
    expiryDate: '2025-01-31',
    beneficiary: '孙丽',
    remarks: '房屋及室内财产保险'
  }
]

export const mockAccidents: Accident[] = [
  {
    id: 'acc-001',
    accidentType: '车辆追尾事故',
    accidentDate: '2024-08-15',
    accidentLocation: '北京市朝阳区建国路',
    description: '被保险人驾驶车辆在建国路与前方车辆发生追尾事故，造成双方车辆损坏。',
    injuryLevel: '轻微',
    damageAmount: 25000,
    policeReport: '是，交警已出具责任认定书',
    witness: '无'
  },
  {
    id: 'acc-002',
    accidentType: '急性心肌梗塞',
    accidentDate: '2024-09-20',
    accidentLocation: '上海市浦东新区',
    description: '被保险人因突发胸痛送医，诊断为急性心肌梗塞，行PCI手术治疗。',
    injuryLevel: '重大疾病',
    damageAmount: 150000,
    policeReport: '否',
    witness: '家属'
  },
  {
    id: 'acc-003',
    accidentType: '高空坠落',
    accidentDate: '2024-10-05',
    accidentLocation: '深圳市南山区',
    description: '被保险人在装修作业时从3米高处坠落，造成多处骨折和内脏损伤。',
    injuryLevel: '重伤',
    damageAmount: 180000,
    policeReport: '是，安监部门已介入',
    witness: '同事2人'
  },
  {
    id: 'acc-004',
    accidentType: '房屋漏水事故',
    accidentDate: '2024-07-10',
    accidentLocation: '广州市天河区',
    description: '因楼上住户水管破裂，导致被保险人家中地板、墙面、家具受损。',
    injuryLevel: '无',
    damageAmount: 85000,
    policeReport: '否，物业已出具证明',
    witness: '物业工作人员'
  }
]

export const mockCalculations: Calculation[] = [
  {
    id: 'calc-001',
    totalLoss: 25000,
    deductible: 500,
    coverageRatio: 0.85,
    payableAmount: 20825,
    limitExceeded: false,
    calculationNote: '车辆损失险赔付，扣除绝对免赔额500元，按85%比例赔付。'
  },
  {
    id: 'calc-003',
    totalLoss: 250000,
    deductible: 0,
    coverageRatio: 1,
    payableAmount: 200000,
    limitExceeded: true,
    limitAmount: 200000,
    calculationNote: '意外伤害身故伤残保额20万元，实际损失超过保额，按保额上限赔付。'
  },
  {
    id: 'calc-004',
    totalLoss: 85000,
    deductible: 1000,
    coverageRatio: 0.9,
    payableAmount: 75600,
    limitExceeded: false,
    calculationNote: '家庭财产保险赔付，扣除免赔额1000元，按90%比例赔付。'
  }
]

export const mockClaims: Claim[] = [
  {
    id: 'claim-001',
    claimNo: 'CLM-2024-08001',
    status: 'PAID',
    policyId: 'pol-001',
    accidentId: 'acc-001',
    calculationId: 'calc-001',
    handlerId: 'user-handler-001',
    reviewerId: 'user-reviewer-001',
    approverId: 'user-approver-001',
    description: '车辆追尾事故理赔，材料齐全，责任清晰。',
    isArchived: false,
    documents: [
      { id: 'doc-001-1', claimId: 'claim-001', name: '理赔申请书', type: '申请书', status: 'RECEIVED', receivedDate: '2024-08-16', required: true },
      { id: 'doc-001-2', claimId: 'claim-001', name: '身份证复印件', type: '身份证明', status: 'RECEIVED', receivedDate: '2024-08-16', required: true },
      { id: 'doc-001-3', claimId: 'claim-001', name: '驾驶证行驶证', type: '证件', status: 'RECEIVED', receivedDate: '2024-08-16', required: true },
      { id: 'doc-001-4', claimId: 'claim-001', name: '交通事故认定书', type: '事故证明', status: 'RECEIVED', receivedDate: '2024-08-17', required: true },
      { id: 'doc-001-5', claimId: 'claim-001', name: '车辆定损单', type: '定损材料', status: 'RECEIVED', receivedDate: '2024-08-18', required: true },
      { id: 'doc-001-6', claimId: 'claim-001', name: '维修发票', type: '费用凭证', status: 'RECEIVED', receivedDate: '2024-08-20', required: true }
    ],
    reviews: [
      { id: 'rev-001-1', claimId: 'claim-001', userId: 'user-handler-001', stage: 'HANDLER', result: 'APPROVED', opinion: '材料齐全，事故真实，核算赔付金额20,825元。', isLiabilityConfirmed: true, createdAt: '2024-08-21' },
      { id: 'rev-001-2', claimId: 'claim-001', userId: 'user-reviewer-001', stage: 'REVIEWER', result: 'APPROVED', opinion: '责任认定清晰，材料完整，同意赔付。', isLiabilityConfirmed: true, createdAt: '2024-08-22' },
      { id: 'rev-001-3', claimId: 'claim-001', userId: 'user-approver-001', stage: 'APPROVER', result: 'APPROVED', opinion: '同意赔付20,825元。', isLiabilityConfirmed: true, createdAt: '2024-08-23' }
    ],
    historyNodes: [
      { id: 'hist-001-1', claimId: 'claim-001', userId: 'user-handler-001', action: '创建卷宗', status: 'DRAFT', remark: '经办人创建理赔卷宗', timestamp: '2024-08-16 09:00:00' },
      { id: 'hist-001-2', claimId: 'claim-001', userId: 'user-handler-001', action: '材料齐全', status: 'UNDER_REVIEW', remark: '所有理赔材料已收齐', timestamp: '2024-08-20 14:30:00' },
      { id: 'hist-001-3', claimId: 'claim-001', userId: 'user-reviewer-001', action: '审核通过', status: 'UNDER_REVIEW', remark: '审核人确认责任，材料完整', timestamp: '2024-08-22 10:15:00' },
      { id: 'hist-001-4', claimId: 'claim-001', userId: 'user-approver-001', action: '赔付批准', status: 'APPROVED', remark: '复核人批准赔付', timestamp: '2024-08-23 16:00:00' },
      { id: 'hist-001-5', claimId: 'claim-001', userId: 'user-approver-001', action: '已赔付', status: 'PAID', remark: '赔款已支付至被保险人账户', timestamp: '2024-08-25 11:00:00' }
    ],
    disputeTerms: [],
    createdAt: '2024-08-16',
    updatedAt: '2024-08-25'
  },
  {
    id: 'claim-002',
    claimNo: 'CLM-2024-09001',
    status: 'MATERIALS_MISSING',
    policyId: 'pol-002',
    accidentId: 'acc-002',
    handlerId: 'user-handler-001',
    reviewerId: 'user-reviewer-001',
    description: '重大疾病理赔，缺少部分医疗证明材料。',
    isArchived: false,
    documents: [
      { id: 'doc-002-1', claimId: 'claim-002', name: '理赔申请书', type: '申请书', status: 'RECEIVED', receivedDate: '2024-09-22', required: true },
      { id: 'doc-002-2', claimId: 'claim-002', name: '身份证复印件', type: '身份证明', status: 'RECEIVED', receivedDate: '2024-09-22', required: true },
      { id: 'doc-002-3', claimId: 'claim-002', name: '诊断证明书', type: '医疗证明', status: 'RECEIVED', receivedDate: '2024-09-22', required: true },
      { id: 'doc-002-4', claimId: 'claim-002', name: '住院病历', type: '医疗记录', status: 'SUPPLEMENT_REQUIRED', required: true, supplementReason: '缺少手术记录和病理报告' },
      { id: 'doc-002-5', claimId: 'claim-002', name: '医疗费用发票', type: '费用凭证', status: 'PENDING', required: true },
      { id: 'doc-002-6', claimId: 'claim-002', name: '费用清单', type: '费用明细', status: 'PENDING', required: true },
      { id: 'doc-002-7', claimId: 'claim-002', name: '出院小结', type: '医疗记录', status: 'PENDING', required: false }
    ],
    reviews: [
      { id: 'rev-002-1', claimId: 'claim-002', userId: 'user-handler-001', stage: 'HANDLER', result: 'SUPPLEMENT_REQUIRED', opinion: '材料不齐全，需补充：1. 手术记录 2. 病理报告 3. 医疗费用发票及清单', isLiabilityConfirmed: false, createdAt: '2024-09-23' }
    ],
    historyNodes: [
      { id: 'hist-002-1', claimId: 'claim-002', userId: 'user-handler-001', action: '创建卷宗', status: 'DRAFT', remark: '经办人创建理赔卷宗', timestamp: '2024-09-22 10:00:00' },
      { id: 'hist-002-2', claimId: 'claim-002', userId: 'user-handler-001', action: '材料初检', status: 'MATERIALS_MISSING', remark: '发现缺少手术记录、病理报告、医疗发票等关键材料', timestamp: '2024-09-23 15:30:00' },
      { id: 'hist-002-3', claimId: 'claim-002', userId: 'user-handler-001', action: '通知补材料', status: 'MATERIALS_MISSING', remark: '已通知被保险人补充缺失材料', timestamp: '2024-09-23 16:00:00' }
    ],
    disputeTerms: [],
    createdAt: '2024-09-22',
    updatedAt: '2024-09-23'
  },
  {
    id: 'claim-003',
    claimNo: 'CLM-2024-10001',
    status: 'LIABILITY_DISPUTE',
    policyId: 'pol-003',
    accidentId: 'acc-003',
    calculationId: 'calc-003',
    handlerId: 'user-handler-001',
    reviewerId: 'user-reviewer-001',
    approverId: 'user-approver-001',
    description: '高空坠落意外伤残理赔，存在责任免除争议。',
    isArchived: false,
    documents: [
      { id: 'doc-003-1', claimId: 'claim-003', name: '理赔申请书', type: '申请书', status: 'RECEIVED', receivedDate: '2024-10-08', required: true },
      { id: 'doc-003-2', claimId: 'claim-003', name: '身份证复印件', type: '身份证明', status: 'RECEIVED', receivedDate: '2024-10-08', required: true },
      { id: 'doc-003-3', claimId: 'claim-003', name: '事故证明', type: '事故证明', status: 'RECEIVED', receivedDate: '2024-10-10', required: true },
      { id: 'doc-003-4', claimId: 'claim-003', name: '伤残鉴定报告', type: '鉴定报告', status: 'RECEIVED', receivedDate: '2024-10-25', required: true },
      { id: 'doc-003-5', claimId: 'claim-003', name: '住院病历', type: '医疗记录', status: 'RECEIVED', receivedDate: '2024-10-20', required: true },
      { id: 'doc-003-6', claimId: 'claim-003', name: '医疗费用发票', type: '费用凭证', status: 'RECEIVED', receivedDate: '2024-10-20', required: true }
    ],
    disputeTerms: [
      {
        id: 'disp-003-1',
        claimId: 'claim-003',
        termClause: '保险条款第6条第3款',
        termDescription: '被保险人从事高风险职业（如高空作业）期间发生的意外伤害，保险公司不承担赔偿责任。',
        disputeReason: '被保险人事故时正在进行装修高空作业，属于条款约定的高风险职业范畴。被保险人投保时未如实告知职业类别。',
        supplementPath: '1. 获取被保险人投保时的职业告知材料；2. 核实事故发生时的具体工作内容；3. 确认是否属于条款约定的免责情形；4. 如需赔付，需投保人补充职业变更告知并缴纳相应保费差额。',
        isResolved: false
      }
    ],
    reviews: [
      { id: 'rev-003-1', claimId: 'claim-003', userId: 'user-handler-001', stage: 'HANDLER', result: 'DISPUTE', opinion: '材料齐全，但存在责任免除争议。被保险人从事高空作业，属于条款约定的高风险职业。', isLiabilityConfirmed: false, createdAt: '2024-10-26' },
      { id: 'rev-003-2', claimId: 'claim-003', userId: 'user-reviewer-001', stage: 'REVIEWER', result: 'DISPUTE', opinion: '同意经办人意见，存在责任免除争议。需进一步核实投保时职业告知情况。', isLiabilityConfirmed: false, createdAt: '2024-10-27' }
    ],
    historyNodes: [
      { id: 'hist-003-1', claimId: 'claim-003', userId: 'user-handler-001', action: '创建卷宗', status: 'DRAFT', remark: '经办人创建理赔卷宗', timestamp: '2024-10-08 11:00:00' },
      { id: 'hist-003-2', claimId: 'claim-003', userId: 'user-handler-001', action: '材料齐全', status: 'UNDER_REVIEW', remark: '所有理赔材料已收齐', timestamp: '2024-10-25 14:00:00' },
      { id: 'hist-003-3', claimId: 'claim-003', userId: 'user-reviewer-001', action: '发现争议', status: 'LIABILITY_DISPUTE', remark: '审核发现责任免除争议：高空作业属于免责条款', timestamp: '2024-10-27 10:30:00' },
      { id: 'hist-003-4', claimId: 'claim-003', userId: 'user-reviewer-001', action: '争议待处理', status: 'LIABILITY_DISPUTE', remark: '需进一步核实投保告知情况，暂不能赔付', timestamp: '2024-10-27 15:00:00' }
    ],
    createdAt: '2024-10-08',
    updatedAt: '2024-10-27'
  },
  {
    id: 'claim-004',
    claimNo: 'CLM-2024-07001',
    status: 'AMOUNT_EXCEEDED',
    policyId: 'pol-004',
    accidentId: 'acc-004',
    calculationId: 'calc-004',
    handlerId: 'user-handler-001',
    reviewerId: 'user-reviewer-001',
    description: '家庭财产保险理赔，实际损失接近保额上限，需复核确认。',
    isArchived: false,
    documents: [
      { id: 'doc-004-1', claimId: 'claim-004', name: '理赔申请书', type: '申请书', status: 'RECEIVED', receivedDate: '2024-07-12', required: true },
      { id: 'doc-004-2', claimId: 'claim-004', name: '身份证复印件', type: '身份证明', status: 'RECEIVED', receivedDate: '2024-07-12', required: true },
      { id: 'doc-004-3', claimId: 'claim-004', name: '房产证复印件', type: '产权证明', status: 'RECEIVED', receivedDate: '2024-07-12', required: true },
      { id: 'doc-004-4', claimId: 'claim-004', name: '事故证明', type: '事故证明', status: 'RECEIVED', receivedDate: '2024-07-13', required: true },
      { id: 'doc-004-5', claimId: 'claim-004', name: '损失清单', type: '损失明细', status: 'RECEIVED', receivedDate: '2024-07-15', required: true },
      { id: 'doc-004-6', claimId: 'claim-004', name: '购置发票', type: '价值证明', status: 'RECEIVED', receivedDate: '2024-07-18', required: true },
      { id: 'doc-004-7', claimId: 'claim-004', name: '现场照片', type: '影像资料', status: 'RECEIVED', receivedDate: '2024-07-12', required: true }
    ],
    reviews: [
      { id: 'rev-004-1', claimId: 'claim-004', userId: 'user-handler-001', stage: 'HANDLER', result: 'APPROVED', opinion: '材料齐全，核算赔付金额75,600元。损失金额较大，接近保额上限，请复核。', isLiabilityConfirmed: true, createdAt: '2024-07-20' },
      { id: 'rev-004-2', claimId: 'claim-004', userId: 'user-reviewer-001', stage: 'REVIEWER', result: 'APPROVED', opinion: '责任清晰，材料完整。赔付金额较大，需上级复核确认。', isLiabilityConfirmed: true, createdAt: '2024-07-21' }
    ],
    historyNodes: [
      { id: 'hist-004-1', claimId: 'claim-004', userId: 'user-handler-001', action: '创建卷宗', status: 'DRAFT', remark: '经办人创建理赔卷宗', timestamp: '2024-07-12 09:30:00' },
      { id: 'hist-004-2', claimId: 'claim-004', userId: 'user-handler-001', action: '材料齐全', status: 'UNDER_REVIEW', remark: '所有理赔材料已收齐', timestamp: '2024-07-18 16:00:00' },
      { id: 'hist-004-3', claimId: 'claim-004', userId: 'user-reviewer-001', action: '审核通过', status: 'UNDER_REVIEW', remark: '审核人确认责任', timestamp: '2024-07-21 11:00:00' },
      { id: 'hist-004-4', claimId: 'claim-004', userId: 'user-reviewer-001', action: '金额超限', status: 'AMOUNT_EXCEEDED', remark: '赔付金额超过5万元标准，需提交高级复核', timestamp: '2024-07-21 14:30:00' }
    ],
    disputeTerms: [],
    createdAt: '2024-07-12',
    updatedAt: '2024-07-21'
  }
]

export function getUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id)
}

export function getPolicyById(id: string): Policy | undefined {
  return mockPolicies.find(p => p.id === id)
}

export function getAccidentById(id: string): Accident | undefined {
  return mockAccidents.find(a => a.id === id)
}

export function getCalculationById(id: string): Calculation | undefined {
  return mockCalculations.find(c => c.id === id)
}

export function getClaimById(id: string): Claim | undefined {
  return mockClaims.find(c => c.id === id)
}

export function getClaimWithDetails(id: string): Claim | undefined {
  const claim = getClaimById(id)
  if (!claim) return undefined

  return {
    ...claim,
    policy: getPolicyById(claim.policyId),
    accident: getAccidentById(claim.accidentId),
    calculation: claim.calculationId ? getCalculationById(claim.calculationId) : undefined,
    handler: claim.handlerId ? getUserById(claim.handlerId) : undefined,
    reviewer: claim.reviewerId ? getUserById(claim.reviewerId) : undefined,
    approver: claim.approverId ? getUserById(claim.approverId) : undefined,
    reviews: claim.reviews.map(r => ({
      ...r,
      user: getUserById(r.userId)
    })),
    historyNodes: claim.historyNodes.map(h => ({
      ...h,
      user: h.userId ? getUserById(h.userId) : undefined
    }))
  }
}

export function getAllClaims(): Claim[] {
  return mockClaims.map(c => ({
    ...c,
    policy: getPolicyById(c.policyId),
    accident: getAccidentById(c.accidentId)
  }))
}

export const statusLabels: Record<ClaimStatus, string> = {
  DRAFT: '草稿',
  MATERIALS_MISSING: '材料缺失',
  MATERIALS_SUPPLEMENTED: '材料已补充',
  UNDER_REVIEW: '审核中',
  LIABILITY_DISPUTE: '责任争议',
  AMOUNT_EXCEEDED: '金额超限',
  APPROVED: '已批准',
  PAID: '已赔付',
  REJECTED: '已拒赔',
  ARCHIVED: '已归档',
  REOPENED: '已重开'
}

export const statusColors: Record<ClaimStatus, string> = {
  DRAFT: '#9ca3af',
  MATERIALS_MISSING: '#f59e0b',
  MATERIALS_SUPPLEMENTED: '#10b981',
  UNDER_REVIEW: '#3b82f6',
  LIABILITY_DISPUTE: '#ef4444',
  AMOUNT_EXCEEDED: '#f97316',
  APPROVED: '#8b5cf6',
  PAID: '#22c55e',
  REJECTED: '#dc2626',
  ARCHIVED: '#6b7280',
  REOPENED: '#0ea5e9'
}

export const documentStatusLabels: Record<DocumentStatus, string> = {
  PENDING: '待提交',
  RECEIVED: '已收到',
  REJECTED: '已退回',
  SUPPLEMENT_REQUIRED: '需补正'
}

export const reviewResultLabels: Record<ReviewResult, string> = {
  PENDING: '待处理',
  APPROVED: '通过',
  REJECTED: '拒绝',
  SUPPLEMENT_REQUIRED: '需补充',
  DISPUTE: '有争议'
}

export const roleLabels: Record<UserRole, string> = {
  HANDLER: '理赔经办人',
  REVIEWER: '审核人',
  APPROVER: '复核人'
}
