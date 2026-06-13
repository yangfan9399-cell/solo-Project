let idCounter = 100

export function generateId() {
  return ++idCounter
}

export function now() {
  return new Date()
}

export function formatDateTime(d: Date) {
  return d.toISOString()
}

export interface UserData {
  id: number
  name: string
  role: string
  department: string
  phone: string | null
  avatar: string | null
  createdAt: string
  updatedAt: string
}

export interface ConsumableRecordData {
  id: number
  recordNo: string
  status: string
  sourceType: string
  sourceId: string | null
  patientName: string
  patientId: string
  deptName: string
  wardName: string | null
  bedNo: string | null
  consumableName: string
  consumableCode: string
  specification: string
  manufacturer: string | null
  batchNo: string
  serialNo: string | null
  quantity: number
  unit: string
  unitPrice: number
  totalAmount: number
  implantDate: string | null
  implantLocation: string | null
  surgeonName: string | null
  nurseName: string | null
  isAbnormal: boolean
  abnormalType: string | null
  abnormalReason: string | null
  conclusion: string | null
  currentHandlerId: number | null
  applicantName: string
  applyDept: string
  applyTime: string
  acceptTime: string | null
  processTime: string | null
  reviewTime: string | null
  archiveTime: string | null
  reviewBasis: string | null
  blockingReason: string | null
  remedialPath: string | null
  diffFieldsJson: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface ReviewNodeData {
  id: number
  recordId: number
  nodeType: string
  nodeStatus: string
  nodeName: string
  nodeOrder: number
  operatorId: number | null
  operatorName: string | null
  handlerId: number | null
  handlerName: string | null
  content: string | null
  basis: string | null
  blockingReason: string | null
  remedialPath: string | null
  diffDataJson: string | null
  remark: string | null
  createdAt: string
  completedAt: string | null
}

export interface AttachmentData {
  id: number
  recordId: number
  nodeId: number | null
  fileName: string
  fileType: string
  fileUrl: string
  fileSize: number | null
  version: number
  uploadedBy: string
  uploadedAt: string
  isEvidence: boolean
}

export interface FieldDiffData {
  id: number
  recordId: number
  nodeId: number | null
  fieldName: string
  fieldLabel: string
  oldValue: string | null
  newValue: string | null
  diffType: string
  changedAt: string
  changedBy: string | null
}

export class InMemoryDB {
  users: UserData[] = []
  records: ConsumableRecordData[] = []
  reviewNodes: ReviewNodeData[] = []
  attachments: AttachmentData[] = []
  fieldDiffs: FieldDiffData[] = []

  constructor() {
    this.seed()
  }

  seed() {
    const dayMs = 24 * 60 * 60 * 1000
    const now = Date.now()

    // 用户
    this.users = [
      { id: 1, name: '张医生', role: 'APPLICANT', department: '骨科', phone: '13800000001', avatar: null, createdAt: new Date(now - 30 * dayMs).toISOString(), updatedAt: new Date(now - 30 * dayMs).toISOString() },
      { id: 2, name: '李护士', role: 'PROCESSOR', department: '耗材科', phone: '13800000002', avatar: null, createdAt: new Date(now - 30 * dayMs).toISOString(), updatedAt: new Date(now - 30 * dayMs).toISOString() },
      { id: 3, name: '王主任', role: 'REVIEWER', department: '医务科', phone: '13800000003', avatar: null, createdAt: new Date(now - 30 * dayMs).toISOString(), updatedAt: new Date(now - 30 * dayMs).toISOString() },
      { id: 4, name: '赵档案', role: 'ARCHIVIST', department: '病案室', phone: '13800000004', avatar: null, createdAt: new Date(now - 30 * dayMs).toISOString(), updatedAt: new Date(now - 30 * dayMs).toISOString() }
    ]

    idCounter = 10

    // 记录1: 正常核销 - 已归档
    const r1: ConsumableRecordData = {
      id: 1,
      recordNo: 'GZ-2024-0001',
      status: 'ARCHIVED',
      sourceType: '住院',
      sourceId: 'ZY20240001',
      patientName: '陈建国',
      patientId: 'P202400001',
      deptName: '骨科',
      wardName: '骨一病区',
      bedNo: '1205',
      consumableName: '人工髋关节假体',
      consumableCode: 'CON-001',
      specification: '生物型 52mm',
      manufacturer: '强生医疗',
      batchNo: 'B202401001',
      serialNo: 'SN0000001',
      quantity: 1,
      unit: '套',
      unitPrice: 28500.00,
      totalAmount: 28500.00,
      implantDate: new Date(now - 6 * dayMs).toISOString(),
      implantLocation: '左侧髋关节',
      surgeonName: '张医生',
      nurseName: '刘护士',
      isAbnormal: false,
      abnormalType: 'NORMAL',
      abnormalReason: null,
      conclusion: '耗材信息完整，与病历记录一致，准予正常核销。',
      currentHandlerId: 4,
      applicantName: '张医生',
      applyDept: '骨科',
      applyTime: new Date(now - 7 * dayMs).toISOString(),
      acceptTime: new Date(now - 7 * dayMs + 2 * 60 * 60 * 1000).toISOString(),
      processTime: new Date(now - 7 * dayMs + 5 * 60 * 60 * 1000).toISOString(),
      reviewTime: new Date(now - 6 * dayMs).toISOString(),
      archiveTime: new Date(now - 5 * dayMs).toISOString(),
      reviewBasis: '《高值医用耗材管理规范》第三章 第十一条',
      blockingReason: null,
      remedialPath: null,
      diffFieldsJson: null,
      version: 1,
      createdAt: new Date(now - 7 * dayMs).toISOString(),
      updatedAt: new Date(now - 5 * dayMs).toISOString()
    }
    this.records.push(r1)

    // 记录1的节点
    const r1Nodes: ReviewNodeData[] = [
      { id: 1, recordId: 1, nodeType: 'ACCEPTANCE', nodeStatus: 'COMPLETED', nodeName: '受理节点', nodeOrder: 1, operatorId: 2, operatorName: '李护士', handlerId: 2, handlerName: '李护士', content: '已受理高值耗材核销申请，信息初步核对无误。', basis: '《高值医用耗材管理规范》', blockingReason: null, remedialPath: null, diffDataJson: null, remark: null, createdAt: new Date(now - 7 * dayMs + 2 * 60 * 60 * 1000).toISOString(), completedAt: new Date(now - 7 * dayMs + 2 * 60 * 60 * 1000).toISOString() },
      { id: 2, recordId: 1, nodeType: 'PROCESSING', nodeStatus: 'COMPLETED', nodeName: '处理节点', nodeOrder: 2, operatorId: 2, operatorName: '李护士', handlerId: 2, handlerName: '李护士', content: '已完成耗材信息核对，产品资质齐全，病历记录完整，符合核销条件。', basis: '人工髋关节假体产品注册证、合格证、手术记录', blockingReason: null, remedialPath: null, diffDataJson: null, remark: null, createdAt: new Date(now - 7 * dayMs + 3 * 60 * 60 * 1000).toISOString(), completedAt: new Date(now - 7 * dayMs + 5 * 60 * 60 * 1000).toISOString() },
      { id: 3, recordId: 1, nodeType: 'REVIEW', nodeStatus: 'COMPLETED', nodeName: '复核节点', nodeOrder: 3, operatorId: 3, operatorName: '王主任', handlerId: 3, handlerName: '王主任', content: '复核通过，耗材信息完整准确，追溯链条清晰，同意归档。', basis: '《高值医用耗材管理规范》第三章 第十一条', blockingReason: null, remedialPath: null, diffDataJson: null, remark: null, createdAt: new Date(now - 6 * dayMs + 8 * 60 * 60 * 1000).toISOString(), completedAt: new Date(now - 6 * dayMs).toISOString() },
      { id: 4, recordId: 1, nodeType: 'ARCHIVE', nodeStatus: 'COMPLETED', nodeName: '归档节点', nodeOrder: 4, operatorId: 4, operatorName: '赵档案', handlerId: 4, handlerName: '赵档案', content: '已完成归档，所有材料齐全，已入病案系统。', basis: '《医院病案管理规定》', blockingReason: null, remedialPath: null, diffDataJson: null, remark: null, createdAt: new Date(now - 5 * dayMs + 2 * 60 * 60 * 1000).toISOString(), completedAt: new Date(now - 5 * dayMs + 4 * 60 * 60 * 1000).toISOString() }
    ]
    this.reviewNodes.push(...r1Nodes)

    // 记录1的附件
    this.attachments.push(
      { id: 1, recordId: 1, nodeId: 2, fileName: '产品合格证.pdf', fileType: 'pdf', fileUrl: '/attachments/1/合格证.pdf', fileSize: null, version: 1, uploadedBy: '李护士', uploadedAt: new Date(now - 7 * dayMs + 4 * 60 * 60 * 1000).toISOString(), isEvidence: true },
      { id: 2, recordId: 1, nodeId: 2, fileName: '手术记录单.pdf', fileType: 'pdf', fileUrl: '/attachments/1/手术记录.pdf', fileSize: null, version: 1, uploadedBy: '张医生', uploadedAt: new Date(now - 7 * dayMs + 4 * 60 * 60 * 1000).toISOString(), isEvidence: true },
      { id: 3, recordId: 1, nodeId: 2, fileName: '产品注册证.pdf', fileType: 'pdf', fileUrl: '/attachments/1/注册证.pdf', fileSize: null, version: 1, uploadedBy: '李护士', uploadedAt: new Date(now - 7 * dayMs + 4 * 60 * 60 * 1000).toISOString(), isEvidence: true }
    )

    // 记录2: 记录漏填 - 处理中
    const r2: ConsumableRecordData = {
      id: 2,
      recordNo: 'GZ-2024-0002',
      status: 'PROCESSING',
      sourceType: '住院',
      sourceId: 'ZY20240002',
      patientName: '王秀兰',
      patientId: 'P202400002',
      deptName: '心内科',
      wardName: '心内一病区',
      bedNo: '803',
      consumableName: '心脏支架',
      consumableCode: 'CON-002',
      specification: '药物洗脱支架 3.0*18mm',
      manufacturer: '波士顿科学',
      batchNo: 'B202402001',
      serialNo: '',
      quantity: 2,
      unit: '根',
      unitPrice: 15800.00,
      totalAmount: 31600.00,
      implantDate: new Date(now - 4 * dayMs).toISOString(),
      implantLocation: '右冠状动脉',
      surgeonName: '李主任',
      nurseName: '',
      isAbnormal: true,
      abnormalType: 'MISSING_RECORD',
      abnormalReason: '关键记录缺失',
      conclusion: null,
      currentHandlerId: 2,
      applicantName: '李主任',
      applyDept: '心内科',
      applyTime: new Date(now - 5 * dayMs).toISOString(),
      acceptTime: new Date(now - 5 * dayMs + 60 * 60 * 1000).toISOString(),
      processTime: null,
      reviewTime: null,
      archiveTime: null,
      reviewBasis: null,
      blockingReason: '序列号为空，无法追溯产品来源；手术护士姓名未填写，责任链条不完整。',
      remedialPath: '1. 联系手术室调取植入记录，补充耗材序列号；\n2. 确认当班巡回护士信息并补录；\n3. 补充完成后重新提交复核。',
      diffFieldsJson: null,
      version: 1,
      createdAt: new Date(now - 5 * dayMs).toISOString(),
      updatedAt: new Date(now - 5 * dayMs + 60 * 60 * 1000).toISOString()
    }
    this.records.push(r2)

    const r2Nodes: ReviewNodeData[] = [
      { id: 5, recordId: 2, nodeType: 'ACCEPTANCE', nodeStatus: 'COMPLETED', nodeName: '受理节点', nodeOrder: 1, operatorId: 2, operatorName: '李护士', handlerId: 2, handlerName: '李护士', content: '已受理心脏支架植入登记申请，初步审核发现信息不完整。', basis: '《高值医用耗材管理规范》', blockingReason: null, remedialPath: null, diffDataJson: null, remark: null, createdAt: new Date(now - 5 * dayMs + 60 * 60 * 1000).toISOString(), completedAt: new Date(now - 5 * dayMs + 60 * 60 * 1000).toISOString() },
      { id: 6, recordId: 2, nodeType: 'PROCESSING', nodeStatus: 'PENDING', nodeName: '处理节点', nodeOrder: 2, operatorId: null, operatorName: null, handlerId: 2, handlerName: '李护士', content: '正在处理中，已发现记录缺漏，待补充后继续。', basis: null, blockingReason: '序列号为空，无法追溯产品来源；手术护士姓名未填写，责任链条不完整。', remedialPath: '1. 联系手术室调取植入记录，补充耗材序列号；\n2. 确认当班巡回护士信息并补录；\n3. 补充完成后重新提交复核。', diffDataJson: null, remark: null, createdAt: new Date(now - 5 * dayMs + 2 * 60 * 60 * 1000).toISOString(), completedAt: null }
    ]
    this.reviewNodes.push(...r2Nodes)

    // 记录2的差异
    this.fieldDiffs.push(
      { id: 1, recordId: 2, nodeId: 6, fieldName: 'serialNo', fieldLabel: '耗材序列号', oldValue: null, newValue: null, diffType: 'EVIDENCE_CONCLUSION', changedAt: new Date(now - 5 * dayMs + 2 * 60 * 60 * 1000).toISOString(), changedBy: '系统检测' },
      { id: 2, recordId: 2, nodeId: 6, fieldName: 'nurseName', fieldLabel: '手术护士', oldValue: null, newValue: null, diffType: 'RESPONSIBLE', changedAt: new Date(now - 5 * dayMs + 2 * 60 * 60 * 1000).toISOString(), changedBy: '系统检测' }
    )

    // 记录2的附件
    this.attachments.push(
      { id: 4, recordId: 2, nodeId: 6, fileName: '产品合格证.pdf', fileType: 'pdf', fileUrl: '/attachments/2/合格证.pdf', fileSize: null, version: 1, uploadedBy: '李主任', uploadedAt: new Date(now - 5 * dayMs + 3 * 60 * 60 * 1000).toISOString(), isEvidence: true }
    )

    // 记录3: 附件版本不一致 - 待复核
    const r3: ConsumableRecordData = {
      id: 3,
      recordNo: 'GZ-2024-0003',
      status: 'PENDING_REVIEW',
      sourceType: '门诊手术',
      sourceId: 'MZ20240001',
      patientName: '刘芳',
      patientId: 'P202400003',
      deptName: '眼科',
      wardName: null,
      bedNo: null,
      consumableName: '人工晶状体',
      consumableCode: 'CON-003',
      specification: '单焦点 +21.0D',
      manufacturer: '蔡司医疗',
      batchNo: 'B202403001',
      serialNo: 'SN0000003',
      quantity: 1,
      unit: '枚',
      unitPrice: 8600.00,
      totalAmount: 8600.00,
      implantDate: new Date(now - 2 * dayMs).toISOString(),
      implantLocation: '左眼',
      surgeonName: '陈主任',
      nurseName: '王护士',
      isAbnormal: true,
      abnormalType: 'ATTACHMENT_VERSION_MISMATCH',
      abnormalReason: '附件版本不一致',
      conclusion: null,
      currentHandlerId: 3,
      applicantName: '陈主任',
      applyDept: '眼科',
      applyTime: new Date(now - 3 * dayMs).toISOString(),
      acceptTime: new Date(now - 3 * dayMs + 3 * 60 * 60 * 1000).toISOString(),
      processTime: new Date(now - 3 * dayMs + 8 * 60 * 60 * 1000).toISOString(),
      reviewTime: null,
      archiveTime: null,
      reviewBasis: null,
      blockingReason: '提交的合格证附件为 v1 版本，而耗材实物标签显示为 v2 版本，版本不一致，无法确认产品合规性。',
      remedialPath: '1. 核对实物标签与系统中附件版本；\n2. 上传最新版本的合格证和质检报告；\n3. 说明版本变更原因并提供厂商证明文件。',
      diffFieldsJson: null,
      version: 2,
      createdAt: new Date(now - 3 * dayMs).toISOString(),
      updatedAt: new Date(now - 3 * dayMs + 8 * 60 * 60 * 1000).toISOString()
    }
    this.records.push(r3)

    const r3Nodes: ReviewNodeData[] = [
      { id: 7, recordId: 3, nodeType: 'ACCEPTANCE', nodeStatus: 'COMPLETED', nodeName: '受理节点', nodeOrder: 1, operatorId: 2, operatorName: '李护士', handlerId: 2, handlerName: '李护士', content: '已受理人工晶状体植入登记申请。', basis: '《高值医用耗材管理规范》', blockingReason: null, remedialPath: null, diffDataJson: null, remark: null, createdAt: new Date(now - 3 * dayMs + 3 * 60 * 60 * 1000).toISOString(), completedAt: new Date(now - 3 * dayMs + 3 * 60 * 60 * 1000).toISOString() },
      { id: 8, recordId: 3, nodeType: 'PROCESSING', nodeStatus: 'COMPLETED', nodeName: '处理节点', nodeOrder: 2, operatorId: 2, operatorName: '李护士', handlerId: 2, handlerName: '李护士', content: '处理完成，已核对基本信息，提交复核。注意：附件版本可能存在差异，请复核时重点关注。', basis: '人工晶状体产品注册证、合格证（v1版本）', blockingReason: null, remedialPath: null, diffDataJson: null, remark: null, createdAt: new Date(now - 3 * dayMs + 4 * 60 * 60 * 1000).toISOString(), completedAt: new Date(now - 3 * dayMs + 8 * 60 * 60 * 1000).toISOString() },
      { id: 9, recordId: 3, nodeType: 'REVIEW', nodeStatus: 'PENDING', nodeName: '复核节点', nodeOrder: 3, operatorId: null, operatorName: null, handlerId: 3, handlerName: '王主任', content: null, basis: null, blockingReason: '提交的合格证附件为 v1 版本，而耗材实物标签显示为 v2 版本，版本不一致，无法确认产品合规性。', remedialPath: '1. 核对实物标签与系统中附件版本；\n2. 上传最新版本的合格证和质检报告；\n3. 说明版本变更原因并提供厂商证明文件。', diffDataJson: null, remark: null, createdAt: new Date(now - 2 * dayMs + 9 * 60 * 60 * 1000).toISOString(), completedAt: null }
    ]
    this.reviewNodes.push(...r3Nodes)

    // 记录3的差异
    this.fieldDiffs.push(
      { id: 3, recordId: 3, nodeId: 9, fieldName: 'attachmentVersion', fieldLabel: '合格证附件版本', oldValue: 'v1', newValue: 'v2', diffType: 'EVIDENCE_CONCLUSION', changedAt: new Date(now - 2 * dayMs + 9 * 60 * 60 * 1000).toISOString(), changedBy: '王主任' }
    )

    // 记录3的附件
    this.attachments.push(
      { id: 5, recordId: 3, nodeId: 8, fileName: '产品合格证.pdf', fileType: 'pdf', fileUrl: '/attachments/3/合格证_v1.pdf', fileSize: null, version: 1, uploadedBy: '陈主任', uploadedAt: new Date(now - 3 * dayMs + 5 * 60 * 60 * 1000).toISOString(), isEvidence: true },
      { id: 6, recordId: 3, nodeId: 8, fileName: '产品注册证.pdf', fileType: 'pdf', fileUrl: '/attachments/3/注册证.pdf', fileSize: null, version: 1, uploadedBy: '陈主任', uploadedAt: new Date(now - 3 * dayMs + 5 * 60 * 60 * 1000).toISOString(), isEvidence: true }
    )

    // 记录4: 重新处理 - 重新处理中
    const r4: ConsumableRecordData = {
      id: 4,
      recordNo: 'GZ-2024-0004',
      status: 'REPROCESSING',
      sourceType: '住院',
      sourceId: 'ZY20240004',
      patientName: '赵伟强',
      patientId: 'P202400004',
      deptName: '神经外科',
      wardName: '神外病区',
      bedNo: '506',
      consumableName: '颅骨修复钛网',
      consumableCode: 'CON-004',
      specification: '三维塑形 12*10cm',
      manufacturer: '美敦力',
      batchNo: 'B202404001',
      serialNo: 'SN0000004',
      quantity: 1,
      unit: '片',
      unitPrice: 42000.00,
      totalAmount: 42000.00,
      implantDate: new Date(now - 10 * dayMs).toISOString(),
      implantLocation: '右侧顶骨',
      surgeonName: '周主任',
      nurseName: '吴护士',
      isAbnormal: true,
      abnormalType: 'REPROCESS',
      abnormalReason: '复核发现问题，退回重新处理',
      conclusion: '因关键信息有误，退回重新处理。待信息更正后再行复核。',
      currentHandlerId: 2,
      applicantName: '周主任',
      applyDept: '神经外科',
      applyTime: new Date(now - 8 * dayMs).toISOString(),
      acceptTime: new Date(now - 8 * dayMs + 2 * 60 * 60 * 1000).toISOString(),
      processTime: new Date(now - 8 * dayMs + 6 * 60 * 60 * 1000).toISOString(),
      reviewTime: new Date(now - 7 * dayMs + 20 * 60 * 60 * 1000).toISOString(),
      archiveTime: null,
      reviewBasis: '《高值医用耗材追溯管理办法》第二十五条',
      blockingReason: '首次处理时植入时间记录有误（应为上午10:30，记录为下午2:00），且责任护士标注错误，需重新核实后处理。',
      remedialPath: '1. 调阅手术麻醉记录，确认准确植入时间；\n2. 核实实际参与手术的护士名单；\n3. 修改完成后重新提交，并标注修改原因。',
      diffFieldsJson: null,
      version: 2,
      createdAt: new Date(now - 8 * dayMs).toISOString(),
      updatedAt: new Date(now - 7 * dayMs + 20 * 60 * 60 * 1000).toISOString()
    }
    this.records.push(r4)

    const r4Nodes: ReviewNodeData[] = [
      { id: 10, recordId: 4, nodeType: 'ACCEPTANCE', nodeStatus: 'COMPLETED', nodeName: '受理节点', nodeOrder: 1, operatorId: 2, operatorName: '李护士', handlerId: 2, handlerName: '李护士', content: '已受理颅骨修复钛网植入登记申请。', basis: '《高值医用耗材管理规范》', blockingReason: null, remedialPath: null, diffDataJson: null, remark: null, createdAt: new Date(now - 8 * dayMs + 2 * 60 * 60 * 1000).toISOString(), completedAt: new Date(now - 8 * dayMs + 2 * 60 * 60 * 1000).toISOString() },
      { id: 11, recordId: 4, nodeType: 'PROCESSING', nodeStatus: 'COMPLETED', nodeName: '处理节点（首次）', nodeOrder: 2, operatorId: 2, operatorName: '李护士', handlerId: 2, handlerName: '李护士', content: '首次处理完成，提交复核。（注：后复核发现问题退回）', basis: '颅骨修复钛网产品注册证、合格证', blockingReason: null, remedialPath: null, diffDataJson: null, remark: null, createdAt: new Date(now - 8 * dayMs + 3 * 60 * 60 * 1000).toISOString(), completedAt: new Date(now - 8 * dayMs + 6 * 60 * 60 * 1000).toISOString() },
      { id: 12, recordId: 4, nodeType: 'REVIEW', nodeStatus: 'REJECTED', nodeName: '复核节点（首次）', nodeOrder: 3, operatorId: 3, operatorName: '王主任', handlerId: 3, handlerName: '王主任', content: '复核退回。发现植入时间和责任护士记录有误，需重新核实。', basis: '《高值医用耗材追溯管理办法》第二十五条', blockingReason: '首次处理时植入时间记录有误（应为上午10:30，记录为下午2:00），且责任护士标注错误，需重新核实后处理。', remedialPath: '1. 调阅手术麻醉记录，确认准确植入时间；\n2. 核实实际参与手术的护士名单；\n3. 修改完成后重新提交，并标注修改原因。', diffDataJson: null, remark: null, createdAt: new Date(now - 7 * dayMs + 8 * 60 * 60 * 1000).toISOString(), completedAt: new Date(now - 7 * dayMs + 20 * 60 * 60 * 1000).toISOString() },
      { id: 13, recordId: 4, nodeType: 'REPROCESS', nodeStatus: 'PENDING', nodeName: '重新处理节点', nodeOrder: 4, operatorId: null, operatorName: null, handlerId: 2, handlerName: '李护士', content: '已退回重新处理，请更正植入时间和责任护士信息后再提交。', basis: null, blockingReason: null, remedialPath: null, diffDataJson: null, remark: null, createdAt: new Date(now - 7 * dayMs + 21 * 60 * 60 * 1000).toISOString(), completedAt: null }
    ]
    this.reviewNodes.push(...r4Nodes)

    // 记录4的差异
    this.fieldDiffs.push(
      { id: 4, recordId: 4, nodeId: 12, fieldName: 'implantDate', fieldLabel: '植入时间', oldValue: '2024-01-15 14:00', newValue: '2024-01-15 10:30', diffType: 'KEY_TIME', changedAt: new Date(now - 7 * dayMs + 20 * 60 * 60 * 1000).toISOString(), changedBy: '王主任' },
      { id: 5, recordId: 4, nodeId: 12, fieldName: 'nurseName', fieldLabel: '责任护士', oldValue: '郑护士', newValue: '吴护士', diffType: 'RESPONSIBLE', changedAt: new Date(now - 7 * dayMs + 20 * 60 * 60 * 1000).toISOString(), changedBy: '王主任' }
    )

    // 记录4的附件
    this.attachments.push(
      { id: 7, recordId: 4, nodeId: 11, fileName: '产品合格证.pdf', fileType: 'pdf', fileUrl: '/attachments/4/合格证.pdf', fileSize: null, version: 1, uploadedBy: '周主任', uploadedAt: new Date(now - 8 * dayMs + 4 * 60 * 60 * 1000).toISOString(), isEvidence: true },
      { id: 8, recordId: 4, nodeId: 11, fileName: '手术记录单.pdf', fileType: 'pdf', fileUrl: '/attachments/4/手术记录.pdf', fileSize: null, version: 1, uploadedBy: '周主任', uploadedAt: new Date(now - 8 * dayMs + 4 * 60 * 60 * 1000).toISOString(), isEvidence: true }
    )

    // 记录5: 待受理
    const r5: ConsumableRecordData = {
      id: 5,
      recordNo: 'GZ-2024-0005',
      status: 'PENDING_ACCEPTANCE',
      sourceType: '住院',
      sourceId: 'ZY20240005',
      patientName: '孙丽华',
      patientId: 'P202400005',
      deptName: '骨科',
      wardName: '骨二病区',
      bedNo: '912',
      consumableName: '脊柱内固定钉棒系统',
      consumableCode: 'CON-005',
      specification: '胸腰段 6钉2棒',
      manufacturer: '美敦力',
      batchNo: 'B202405001',
      serialNo: 'SN0000005A',
      quantity: 1,
      unit: '套',
      unitPrice: 36500.00,
      totalAmount: 36500.00,
      implantDate: new Date(now - 1 * dayMs).toISOString(),
      implantLocation: 'L2-L4 椎体',
      surgeonName: '张医生',
      nurseName: '陈护士',
      isAbnormal: false,
      abnormalType: null,
      abnormalReason: null,
      conclusion: null,
      currentHandlerId: null,
      applicantName: '张医生',
      applyDept: '骨科',
      applyTime: new Date(now - 2 * dayMs).toISOString(),
      acceptTime: null,
      processTime: null,
      reviewTime: null,
      archiveTime: null,
      reviewBasis: null,
      blockingReason: null,
      remedialPath: null,
      diffFieldsJson: null,
      version: 1,
      createdAt: new Date(now - 2 * dayMs).toISOString(),
      updatedAt: new Date(now - 2 * dayMs).toISOString()
    }
    this.records.push(r5)

    const r5Nodes: ReviewNodeData[] = [
      { id: 14, recordId: 5, nodeType: 'ACCEPTANCE', nodeStatus: 'PENDING', nodeName: '受理节点', nodeOrder: 1, operatorId: null, operatorName: null, handlerId: 2, handlerName: '李护士', content: null, basis: null, blockingReason: null, remedialPath: null, diffDataJson: null, remark: null, createdAt: new Date(now - 2 * dayMs).toISOString(), completedAt: null }
    ]
    this.reviewNodes.push(...r5Nodes)

    // 记录6: 复核通过待归档
    const r6: ConsumableRecordData = {
      id: 6,
      recordNo: 'GZ-2024-0006',
      status: 'REVIEW_PASSED',
      sourceType: '住院',
      sourceId: 'ZY20240006',
      patientName: '钱志明',
      patientId: 'P202400006',
      deptName: '普外科',
      wardName: '普外病区',
      bedNo: '608',
      consumableName: '一次性使用吻合器',
      consumableCode: 'CON-006',
      specification: '管型 29mm',
      manufacturer: '柯惠医疗',
      batchNo: 'B202406001',
      serialNo: 'SN0000006',
      quantity: 1,
      unit: '把',
      unitPrice: 12800.00,
      totalAmount: 12800.00,
      implantDate: new Date(now - 3 * dayMs).toISOString(),
      implantLocation: '直肠',
      surgeonName: '黄主任',
      nurseName: '林护士',
      isAbnormal: false,
      abnormalType: 'NORMAL',
      abnormalReason: null,
      conclusion: '经复核，耗材信息完整准确，来源可追溯，同意归档。',
      currentHandlerId: 4,
      applicantName: '黄主任',
      applyDept: '普外科',
      applyTime: new Date(now - 4 * dayMs).toISOString(),
      acceptTime: new Date(now - 4 * dayMs + 60 * 60 * 1000).toISOString(),
      processTime: new Date(now - 4 * dayMs + 4 * 60 * 60 * 1000).toISOString(),
      reviewTime: new Date(now - 3 * dayMs + 18 * 60 * 60 * 1000).toISOString(),
      archiveTime: null,
      reviewBasis: '《医用耗材临床应用管理办法》',
      blockingReason: null,
      remedialPath: null,
      diffFieldsJson: null,
      version: 1,
      createdAt: new Date(now - 4 * dayMs).toISOString(),
      updatedAt: new Date(now - 3 * dayMs + 18 * 60 * 60 * 1000).toISOString()
    }
    this.records.push(r6)

    const r6Nodes: ReviewNodeData[] = [
      { id: 15, recordId: 6, nodeType: 'ACCEPTANCE', nodeStatus: 'COMPLETED', nodeName: '受理节点', nodeOrder: 1, operatorId: 2, operatorName: '李护士', handlerId: 2, handlerName: '李护士', content: '已受理一次性使用吻合器登记申请。', basis: '《高值医用耗材管理规范》', blockingReason: null, remedialPath: null, diffDataJson: null, remark: null, createdAt: new Date(now - 4 * dayMs + 60 * 60 * 1000).toISOString(), completedAt: new Date(now - 4 * dayMs + 60 * 60 * 1000).toISOString() },
      { id: 16, recordId: 6, nodeType: 'PROCESSING', nodeStatus: 'COMPLETED', nodeName: '处理节点', nodeOrder: 2, operatorId: 2, operatorName: '李护士', handlerId: 2, handlerName: '李护士', content: '处理完成，信息核对无误，提交复核。', basis: '吻合器产品注册证、合格证、手术记录', blockingReason: null, remedialPath: null, diffDataJson: null, remark: null, createdAt: new Date(now - 4 * dayMs + 2 * 60 * 60 * 1000).toISOString(), completedAt: new Date(now - 4 * dayMs + 4 * 60 * 60 * 1000).toISOString() },
      { id: 17, recordId: 6, nodeType: 'REVIEW', nodeStatus: 'COMPLETED', nodeName: '复核节点', nodeOrder: 3, operatorId: 3, operatorName: '王主任', handlerId: 3, handlerName: '王主任', content: '复核通过，耗材信息完整准确，追溯链条清晰，同意归档。', basis: '《医用耗材临床应用管理办法》', blockingReason: null, remedialPath: null, diffDataJson: null, remark: null, createdAt: new Date(now - 3 * dayMs + 5 * 60 * 60 * 1000).toISOString(), completedAt: new Date(now - 3 * dayMs + 18 * 60 * 60 * 1000).toISOString() },
      { id: 18, recordId: 6, nodeType: 'ARCHIVE', nodeStatus: 'PENDING', nodeName: '归档节点', nodeOrder: 4, operatorId: null, operatorName: null, handlerId: 4, handlerName: '赵档案', content: null, basis: null, blockingReason: null, remedialPath: null, diffDataJson: null, remark: null, createdAt: new Date(now - 3 * dayMs + 19 * 60 * 60 * 1000).toISOString(), completedAt: null }
    ]
    this.reviewNodes.push(...r6Nodes)

    // 记录6的附件
    this.attachments.push(
      { id: 9, recordId: 6, nodeId: 16, fileName: '产品合格证.pdf', fileType: 'pdf', fileUrl: '/attachments/6/合格证.pdf', fileSize: null, version: 1, uploadedBy: '黄主任', uploadedAt: new Date(now - 4 * dayMs + 3 * 60 * 60 * 1000).toISOString(), isEvidence: true },
      { id: 10, recordId: 6, nodeId: 16, fileName: '手术记录单.pdf', fileType: 'pdf', fileUrl: '/attachments/6/手术记录.pdf', fileSize: null, version: 1, uploadedBy: '黄主任', uploadedAt: new Date(now - 4 * dayMs + 3 * 60 * 60 * 1000).toISOString(), isEvidence: true }
    )

    idCounter = 100
  }

  // 记录查询
  findRecords(params: {
    page?: number
    pageSize?: number
    status?: string
    abnormalType?: string
    deptName?: string
    isAbnormal?: string
    keyword?: string
  } = {}) {
    const { page = 1, pageSize = 10, status, abnormalType, deptName, isAbnormal, keyword } = params

    let filtered = [...this.records]

    if (status && status !== 'all') {
      filtered = filtered.filter(r => r.status === status)
    }
    if (abnormalType && abnormalType !== 'all') {
      filtered = filtered.filter(r => r.abnormalType === abnormalType)
    }
    if (deptName && deptName !== 'all') {
      filtered = filtered.filter(r => r.deptName === deptName)
    }
    if (isAbnormal !== undefined && isAbnormal !== 'all') {
      filtered = filtered.filter(r => r.isAbnormal === (isAbnormal === 'true'))
    }
    if (keyword) {
      const kw = keyword.toLowerCase()
      filtered = filtered.filter(r =>
        r.recordNo.toLowerCase().includes(kw) ||
        r.patientName.toLowerCase().includes(kw) ||
        r.consumableName.toLowerCase().includes(kw)
      )
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const total = filtered.length
    const start = (page - 1) * pageSize
    const data = filtered.slice(start, start + pageSize).map(r => this.enrichRecord(r))

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
  }

  enrichRecord(record: ConsumableRecordData) {
    const handler = this.users.find(u => u.id === record.currentHandlerId)
    const nodes = this.reviewNodes.filter(n => n.recordId === record.id).sort((a, b) => a.nodeOrder - b.nodeOrder)
    const attachmentCount = this.attachments.filter(a => a.recordId === record.id).length

    return {
      ...record,
      currentHandler: handler || null,
      reviewNodes: nodes,
      attachments: this.attachments.filter(a => a.recordId === record.id),
      fieldDiffs: this.fieldDiffs.filter(f => f.recordId === record.id),
      _count: {
        attachments: attachmentCount,
        reviewNodes: nodes.length
      }
    }
  }

  findRecordById(id: number) {
    const record = this.records.find(r => r.id === id)
    if (!record) return null
    return this.enrichRecord(record)
  }

  // 受理
  acceptRecord(id: number, data: {
    operatorId: number
    operatorName: string
    handlerId: number
    handlerName: string
    content: string
    basis: string
  }) {
    const record = this.records.find(r => r.id === id)
    if (!record) throw new Error('记录不存在')
    if (record.status === 'ARCHIVED') throw new Error('记录已归档，处于只读状态，不允许任何修改操作')
    const operator = this.users.find(u => u.id === data.operatorId)
    if (!operator) throw new Error('操作用户不存在')
    if (operator.role !== 'PROCESSOR') throw new Error('只有处理人(耗材科)可以执行受理操作')
    if (record.status !== 'PENDING_ACCEPTANCE') throw new Error('当前状态不允许受理')

    record.status = 'ACCEPTED'
    record.currentHandlerId = data.handlerId
    record.acceptTime = new Date().toISOString()
    record.updatedAt = new Date().toISOString()

    const nodes = this.reviewNodes.filter(n => n.recordId === id)
    const acceptNode = nodes.find(n => n.nodeType === 'ACCEPTANCE' && n.nodeStatus === 'PENDING')
    if (acceptNode) {
      acceptNode.nodeStatus = 'COMPLETED'
      acceptNode.operatorId = data.operatorId
      acceptNode.operatorName = data.operatorName
      acceptNode.content = data.content || '已受理申请'
      acceptNode.basis = data.basis || null
      acceptNode.completedAt = new Date().toISOString()
    }

    const processNode = nodes.find(n => n.nodeType === 'PROCESSING')
    if (processNode) {
      processNode.handlerId = data.handlerId
      processNode.handlerName = data.handlerName
    } else {
      const maxOrder = Math.max(...nodes.map(n => n.nodeOrder), 0)
      this.reviewNodes.push({
        id: generateId(),
        recordId: id,
        nodeType: 'PROCESSING',
        nodeStatus: 'PENDING',
        nodeName: '处理节点',
        nodeOrder: maxOrder + 1,
        operatorId: null,
        operatorName: null,
        handlerId: data.handlerId,
        handlerName: data.handlerName,
        content: null,
        basis: null,
        blockingReason: null,
        remedialPath: null,
        diffDataJson: null,
        remark: null,
        createdAt: new Date().toISOString(),
        completedAt: null
      })
    }

    return record
  }

  // 处理
  processRecord(id: number, data: {
    operatorId: number
    operatorName: string
    content: string
    basis: string
    isAbnormal: boolean
    abnormalType: string | null
    abnormalReason: string | null
    blockingReason: string | null
    remedialPath: string | null
    attachments?: any[]
  }) {
    const record = this.records.find(r => r.id === id)
    if (!record) throw new Error('记录不存在')
    if (record.status === 'ARCHIVED') throw new Error('记录已归档，处于只读状态，不允许任何修改操作')
    const operator = this.users.find(u => u.id === data.operatorId)
    if (!operator) throw new Error('操作用户不存在')
    if (operator.role !== 'PROCESSOR') throw new Error('只有处理人(耗材科)可以执行处理操作')
    if (!['ACCEPTED', 'REPROCESSING', 'PROCESSING'].includes(record.status)) throw new Error('当前状态不允许处理')

    record.status = 'PENDING_REVIEW'
    record.processTime = new Date().toISOString()
    record.isAbnormal = data.isAbnormal || false
    record.abnormalType = data.abnormalType || null
    record.abnormalReason = data.abnormalReason || null
    record.blockingReason = data.isAbnormal ? data.blockingReason || null : null
    record.remedialPath = data.isAbnormal ? data.remedialPath || null : null
    record.updatedAt = new Date().toISOString()

    const nodes = this.reviewNodes.filter(n => n.recordId === id).sort((a, b) => a.nodeOrder - b.nodeOrder)
    const currentNode = nodes.find(
      n => (n.nodeType === 'PROCESSING' || n.nodeType === 'REPROCESS') && n.nodeStatus === 'PENDING'
    )

    if (currentNode) {
      currentNode.nodeStatus = 'COMPLETED'
      currentNode.operatorId = data.operatorId
      currentNode.operatorName = data.operatorName
      currentNode.content = data.content || '处理完成，提交复核'
      currentNode.basis = data.basis || null
      currentNode.blockingReason = data.isAbnormal ? data.blockingReason || null : null
      currentNode.remedialPath = data.isAbnormal ? data.remedialPath || null : null
      currentNode.completedAt = new Date().toISOString()
    }

    const reviewNode = nodes.find(n => n.nodeType === 'REVIEW')
    if (reviewNode) {
      reviewNode.nodeStatus = 'PENDING'
      reviewNode.handlerId = 3
      reviewNode.handlerName = '王主任'
    } else {
      const maxOrder = Math.max(...nodes.map(n => n.nodeOrder), 0)
      this.reviewNodes.push({
        id: generateId(),
        recordId: id,
        nodeType: 'REVIEW',
        nodeStatus: 'PENDING',
        nodeName: '复核节点',
        nodeOrder: maxOrder + 1,
        operatorId: null,
        operatorName: null,
        handlerId: 3,
        handlerName: '王主任',
        content: null,
        basis: null,
        blockingReason: null,
        remedialPath: null,
        diffDataJson: null,
        remark: null,
        createdAt: new Date().toISOString(),
        completedAt: null
      })
    }

    if (data.attachments && data.attachments.length > 0) {
      for (const att of data.attachments) {
        this.attachments.push({
          id: generateId(),
          recordId: id,
          nodeId: currentNode?.id || null,
          fileName: att.fileName,
          fileType: att.fileType,
          fileUrl: att.fileUrl,
          fileSize: null,
          version: att.version || 1,
          uploadedBy: data.operatorName,
          uploadedAt: new Date().toISOString(),
          isEvidence: att.isEvidence || false
        })
      }
    }

    record.currentHandlerId = 3
    return record
  }

  // 复核
  reviewRecord(id: number, data: {
    operatorId: number
    operatorName: string
    passed: boolean
    content: string
    conclusion: string
    basis: string
    blockingReason: string | null
    remedialPath: string | null
    fieldDiffs?: any[]
  }) {
    const record = this.records.find(r => r.id === id)
    if (!record) throw new Error('记录不存在')
    if (record.status === 'ARCHIVED') throw new Error('记录已归档，处于只读状态，不允许任何修改操作')
    const operator = this.users.find(u => u.id === data.operatorId)
    if (!operator) throw new Error('操作用户不存在')
    if (operator.role !== 'REVIEWER') throw new Error('只有复核人(医务科)可以执行复核操作')
    if (record.status !== 'PENDING_REVIEW') throw new Error('当前状态不允许复核')

    record.reviewTime = new Date().toISOString()
    record.reviewBasis = data.basis || null
    record.conclusion = data.conclusion || null
    record.updatedAt = new Date().toISOString()

    if (data.passed) {
      record.status = 'REVIEW_PASSED'
      record.currentHandlerId = 4
      record.blockingReason = null
      record.remedialPath = null
    } else {
      record.status = 'REPROCESSING'
      record.currentHandlerId = 2
      record.blockingReason = data.blockingReason || null
      record.remedialPath = data.remedialPath || null
      record.version = (record.version || 1) + 1
      record.isAbnormal = true
      record.abnormalType = 'REPROCESS'
    }

    const nodes = this.reviewNodes.filter(n => n.recordId === id)
    const reviewNode = nodes.find(n => n.nodeType === 'REVIEW' && n.nodeStatus === 'PENDING')

    if (reviewNode) {
      reviewNode.nodeStatus = data.passed ? 'COMPLETED' : 'REJECTED'
      reviewNode.operatorId = data.operatorId
      reviewNode.operatorName = data.operatorName
      reviewNode.content = data.content || (data.passed ? '复核通过' : '复核退回')
      reviewNode.basis = data.basis || null
      reviewNode.blockingReason = data.passed ? null : data.blockingReason || null
      reviewNode.remedialPath = data.passed ? null : data.remedialPath || null
      reviewNode.completedAt = new Date().toISOString()
    }

    if (data.passed) {
      const archiveNode = nodes.find(n => n.nodeType === 'ARCHIVE')
      if (archiveNode) {
        archiveNode.nodeStatus = 'PENDING'
        archiveNode.handlerId = 4
        archiveNode.handlerName = '赵档案'
      } else {
        const maxOrder = Math.max(...nodes.map(n => n.nodeOrder), 0)
        this.reviewNodes.push({
          id: generateId(),
          recordId: id,
          nodeType: 'ARCHIVE',
          nodeStatus: 'PENDING',
          nodeName: '归档节点',
          nodeOrder: maxOrder + 1,
          operatorId: null,
          operatorName: null,
          handlerId: 4,
          handlerName: '赵档案',
          content: null,
          basis: null,
          blockingReason: null,
          remedialPath: null,
          diffDataJson: null,
          remark: null,
          createdAt: new Date().toISOString(),
          completedAt: null
        })
      }
    }

    if (data.fieldDiffs && data.fieldDiffs.length > 0) {
      for (const diff of data.fieldDiffs) {
        this.fieldDiffs.push({
          id: generateId(),
          recordId: id,
          nodeId: reviewNode?.id || null,
          fieldName: diff.fieldName,
          fieldLabel: diff.fieldLabel,
          oldValue: diff.oldValue || null,
          newValue: diff.newValue || null,
          diffType: diff.diffType,
          changedAt: new Date().toISOString(),
          changedBy: data.operatorName
        })
      }
    }

    if (!data.passed) {
      const maxOrder = Math.max(...nodes.map(n => n.nodeOrder), 0)
      this.reviewNodes.push({
        id: generateId(),
        recordId: id,
        nodeType: 'REPROCESS',
        nodeStatus: 'PENDING',
        nodeName: '重新处理节点',
        nodeOrder: maxOrder + 1,
        operatorId: null,
        operatorName: null,
        handlerId: 2,
        handlerName: '李护士',
        content: data.content || '复核退回，需重新处理',
        basis: null,
        blockingReason: data.blockingReason || null,
        remedialPath: data.remedialPath || null,
        diffDataJson: null,
        remark: null,
        createdAt: new Date().toISOString(),
        completedAt: null
      })
    }

    return record
  }

  // 归档
  archiveRecord(id: number, data: {
    operatorId: number
    operatorName: string
    content: string
    basis: string
  }) {
    const record = this.records.find(r => r.id === id)
    if (!record) throw new Error('记录不存在')
    if (record.status === 'ARCHIVED') throw new Error('记录已归档，不允许重复归档')
    const operator = this.users.find(u => u.id === data.operatorId)
    if (!operator) throw new Error('操作用户不存在')
    if (operator.role !== 'ARCHIVIST') throw new Error('只有归档人(病案室)可以执行归档操作')
    if (record.status !== 'REVIEW_PASSED') throw new Error('当前状态不允许归档')

    record.status = 'ARCHIVED'
    record.archiveTime = new Date().toISOString()
    record.updatedAt = new Date().toISOString()

    const nodes = this.reviewNodes.filter(n => n.recordId === id)
    const archiveNode = nodes.find(n => n.nodeType === 'ARCHIVE' && n.nodeStatus === 'PENDING')

    if (archiveNode) {
      archiveNode.nodeStatus = 'COMPLETED'
      archiveNode.operatorId = data.operatorId
      archiveNode.operatorName = data.operatorName
      archiveNode.content = data.content || '已完成归档'
      archiveNode.basis = data.basis || null
      archiveNode.completedAt = new Date().toISOString()
    }

    return record
  }

  // 补充材料
  supplementRecord(id: number, data: {
    operatorId: number
    operatorName: string
    content: string
    attachments?: any[]
    businessRecord?: string
    siteNote?: string
  }) {
    const record = this.records.find(r => r.id === id)
    if (!record) throw new Error('记录不存在')
    if (record.status === 'ARCHIVED') throw new Error('记录已归档，处于只读状态，不允许任何修改操作')
    const operator = this.users.find(u => u.id === data.operatorId)
    if (!operator) throw new Error('操作用户不存在')
    if (operator.role !== 'APPLICANT' && operator.role !== 'PROCESSOR') {
      throw new Error('只有申请人或处理人可以补充材料')
    }

    const nodes = this.reviewNodes.filter(n => n.recordId === id)
    const maxOrder = nodes.length > 0 ? Math.max(...nodes.map(n => n.nodeOrder)) : 0

    const supplementNode: ReviewNodeData = {
      id: generateId(),
      recordId: id,
      nodeType: 'SUPPLEMENT',
      nodeStatus: 'COMPLETED',
      nodeName: '补证节点',
      nodeOrder: maxOrder + 1,
      operatorId: data.operatorId,
      operatorName: data.operatorName,
      handlerId: data.operatorId,
      handlerName: data.operatorName,
      content: data.content || '补充了业务记录和证据材料',
      basis: null,
      blockingReason: null,
      remedialPath: null,
      diffDataJson: null,
      remark: null,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    }
    this.reviewNodes.push(supplementNode)

    if (data.attachments && data.attachments.length > 0) {
      for (const att of data.attachments) {
        this.attachments.push({
          id: generateId(),
          recordId: id,
          nodeId: supplementNode.id,
          fileName: att.fileName,
          fileType: att.fileType,
          fileUrl: att.fileUrl,
          fileSize: null,
          version: att.version || 1,
          uploadedBy: data.operatorName,
          uploadedAt: new Date().toISOString(),
          isEvidence: att.isEvidence || false
        })
      }
    }

    record.updatedAt = new Date().toISOString()
    return { success: true, data: supplementNode }
  }

  // 重新处理
  reprocessRecord(id: number, data: {
    operatorId: number
    operatorName: string
    content: string
    handlerId: number
    handlerName: string
    reason: string
  }) {
    const record = this.records.find(r => r.id === id)
    if (!record) throw new Error('记录不存在')
    if (record.status === 'ARCHIVED') throw new Error('记录已归档，处于只读状态，不允许任何修改操作')
    const operator = this.users.find(u => u.id === data.operatorId)
    if (!operator) throw new Error('操作用户不存在')
    const isArchivistReturn = operator.role === 'ARCHIVIST' && record.status === 'REVIEW_PASSED'
    if (operator.role !== 'REVIEWER' && operator.role !== 'PROCESSOR' && !isArchivistReturn) {
      throw new Error('只有复核人、处理人或归档复核人(退回补证)可以启动重新处理')
    }
    if (!['REVIEW_REJECTED', 'REVIEW_PASSED'].includes(record.status)) {
      throw new Error('当前状态不允许重新处理')
    }

    record.status = 'REPROCESSING'
    record.currentHandlerId = data.handlerId
    record.isAbnormal = true
    record.abnormalType = 'REPROCESS'
    record.abnormalReason = data.reason || '复核退回重新处理'
    record.version = (record.version || 1) + 1
    record.updatedAt = new Date().toISOString()

    const nodes = this.reviewNodes.filter(n => n.recordId === id)
    const maxOrder = nodes.length > 0 ? Math.max(...nodes.map(n => n.nodeOrder)) : 0

    this.reviewNodes.push({
      id: generateId(),
      recordId: id,
      nodeType: 'REPROCESS',
      nodeStatus: 'PENDING',
      nodeName: '重新处理节点',
      nodeOrder: maxOrder + 1,
      operatorId: null,
      operatorName: null,
      handlerId: data.handlerId,
      handlerName: data.handlerName,
      content: data.content || '已退回重新处理',
      basis: data.reason || null,
      blockingReason: null,
      remedialPath: null,
      diffDataJson: null,
      remark: null,
      createdAt: new Date().toISOString(),
      completedAt: null
    })

    return record
  }

  // 统计
  getStats() {
    const records = this.records
    const total = records.length

    const statusStats: any[] = []
    const statusGroups: Record<string, number> = {}
    for (const r of records) {
      statusGroups[r.status] = (statusGroups[r.status] || 0) + 1
    }
    for (const [status, count] of Object.entries(statusGroups)) {
      statusStats.push({ status, _count: count })
    }

    const normalCount = records.filter(r => !r.isAbnormal).length
    const abnormalCount = records.filter(r => r.isAbnormal).length
    const archivedCount = records.filter(r => r.status === 'ARCHIVED').length

    const abnormalByType: Record<string, number> = {}
    for (const r of records) {
      if (r.isAbnormal && r.abnormalType) {
        abnormalByType[r.abnormalType] = (abnormalByType[r.abnormalType] || 0) + 1
      }
    }
    const byType = Object.entries(abnormalByType).map(([type, count]) => ({ type, count }))
    const abnormalTypeStats = byType.map(t => ({ abnormalType: t.type, _count: t.count }))

    const deptGroups: Record<string, { count: number; totalAmount: number }> = {}
    for (const r of records) {
      if (!deptGroups[r.deptName]) {
        deptGroups[r.deptName] = { count: 0, totalAmount: 0 }
      }
      deptGroups[r.deptName].count++
      deptGroups[r.deptName].totalAmount += r.totalAmount
    }
    const deptStats = Object.entries(deptGroups)
      .map(([deptName, data]) => ({ deptName, count: data.count, totalAmount: data.totalAmount }))
      .sort((a, b) => b.count - a.count)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayRecords = records.filter(r => new Date(r.createdAt) >= today)
    const todayCount = todayRecords.length
    const todayAmount = todayRecords.reduce((sum, r) => sum + r.totalAmount, 0)

    const totalAmount = records.reduce((sum, r) => sum + r.totalAmount, 0)
    const avgAmount = total > 0 ? totalAmount / total : 0

    return {
      overview: {
        total,
        normal: normalCount,
        abnormal: abnormalCount,
        archived: archivedCount,
        abnormalRate: total > 0 ? ((abnormalCount / total) * 100).toFixed(1) + '%' : '0%'
      },
      statusStats,
      abnormalStats: {
        normal: normalCount,
        abnormal: abnormalCount,
        byType
      },
      abnormalTypeStats,
      deptStats,
      today: {
        count: todayCount,
        amount: todayAmount
      },
      amount: {
        total: totalAmount,
        average: avgAmount
      }
    }
  }
}

export const inMemoryDB = new InMemoryDB()
