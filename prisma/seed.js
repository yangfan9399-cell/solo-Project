import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始播种数据...')

  // 1. 清空现有数据
  console.log('🧹 清空现有数据...')
  await prisma.fieldDiff.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.reviewNode.deleteMany()
  await prisma.consumableRecord.deleteMany()
  await prisma.user.deleteMany()

  // 2. 创建用户
  console.log('👤 创建用户...')
  const [applicant, processor, reviewer, archivist] = await Promise.all([
    prisma.user.create({
      data: {
        name: '张医生',
        role: 'APPLICANT',
        department: '骨科',
        phone: '13800000001'
      }
    }),
    prisma.user.create({
      data: {
        name: '李护士',
        role: 'PROCESSOR',
        department: '耗材科',
        phone: '13800000002'
      }
    }),
    prisma.user.create({
      data: {
        name: '王主任',
        role: 'REVIEWER',
        department: '医务科',
        phone: '13800000003'
      }
    }),
    prisma.user.create({
      data: {
        name: '赵档案',
        role: 'ARCHIVIST',
        department: '病案室',
        phone: '13800000004'
      }
    })
  ])
  console.log('✅ 用户创建完成')

  const now = new Date()
  const dayMs = 24 * 60 * 60 * 1000

  // 3. 创建样本记录 1: 正常核销 - 已归档
  console.log('📋 创建样本记录 1: 正常核销...')
  const record1 = await prisma.consumableRecord.create({
    data: {
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
      implantDate: new Date(now.getTime() - 6 * dayMs),
      implantLocation: '左侧髋关节',
      surgeonName: '张医生',
      nurseName: '刘护士',
      isAbnormal: false,
      abnormalType: 'NORMAL',
      conclusion: '耗材信息完整，与病历记录一致，准予正常核销。',
      currentHandlerId: archivist.id,
      applicantName: '张医生',
      applyDept: '骨科',
      applyTime: new Date(now.getTime() - 7 * dayMs),
      acceptTime: new Date(now.getTime() - 7 * dayMs + 2 * 60 * 60 * 1000),
      processTime: new Date(now.getTime() - 7 * dayMs + 5 * 60 * 60 * 1000),
      reviewTime: new Date(now.getTime() - 6 * dayMs),
      archiveTime: new Date(now.getTime() - 5 * dayMs),
      reviewBasis: '《高值医用耗材管理规范》第三章 第十一条',
      version: 1
    }
  })

  // 创建记录1的审核节点
  await prisma.reviewNode.createMany({
    data: [
      {
        recordId: record1.id,
        nodeType: 'ACCEPTANCE',
        nodeStatus: 'COMPLETED',
        nodeName: '受理节点',
        nodeOrder: 1,
        operatorId: processor.id,
        operatorName: processor.name,
        handlerId: processor.id,
        handlerName: processor.name,
        content: '已受理高值耗材核销申请，信息初步核对无误。',
        basis: '《高值医用耗材管理规范》',
        createdAt: new Date(now.getTime() - 7 * dayMs + 2 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 7 * dayMs + 2 * 60 * 60 * 1000)
      },
      {
        recordId: record1.id,
        nodeType: 'PROCESSING',
        nodeStatus: 'COMPLETED',
        nodeName: '处理节点',
        nodeOrder: 2,
        operatorId: processor.id,
        operatorName: processor.name,
        handlerId: processor.id,
        handlerName: processor.name,
        content: '已完成耗材信息核对，产品资质齐全，病历记录完整，符合核销条件。',
        basis: '人工髋关节假体产品注册证、合格证、手术记录',
        createdAt: new Date(now.getTime() - 7 * dayMs + 3 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 7 * dayMs + 5 * 60 * 60 * 1000)
      },
      {
        recordId: record1.id,
        nodeType: 'REVIEW',
        nodeStatus: 'COMPLETED',
        nodeName: '复核节点',
        nodeOrder: 3,
        operatorId: reviewer.id,
        operatorName: reviewer.name,
        handlerId: reviewer.id,
        handlerName: reviewer.name,
        content: '复核通过，耗材信息完整准确，追溯链条清晰，同意归档。',
        basis: '《高值医用耗材管理规范》第三章 第十一条',
        createdAt: new Date(now.getTime() - 6 * dayMs + 8 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 6 * dayMs)
      },
      {
        recordId: record1.id,
        nodeType: 'ARCHIVE',
        nodeStatus: 'COMPLETED',
        nodeName: '归档节点',
        nodeOrder: 4,
        operatorId: archivist.id,
        operatorName: archivist.name,
        handlerId: archivist.id,
        handlerName: archivist.name,
        content: '已完成归档，所有材料齐全，已入病案系统。',
        basis: '《医院病案管理规定》',
        createdAt: new Date(now.getTime() - 5 * dayMs + 2 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 5 * dayMs + 4 * 60 * 60 * 1000)
      }
    ]
  })

  // 创建记录1的附件
  const nodes1 = await prisma.reviewNode.findMany({
    where: { recordId: record1.id },
    orderBy: { nodeOrder: 'asc' }
  })
  await prisma.attachment.createMany({
    data: [
      {
        recordId: record1.id,
        nodeId: nodes1[1].id,
        fileName: '产品合格证.pdf',
        fileType: 'pdf',
        fileUrl: '/attachments/1/合格证.pdf',
        version: 1,
        uploadedBy: processor.name,
        isEvidence: true
      },
      {
        recordId: record1.id,
        nodeId: nodes1[1].id,
        fileName: '手术记录单.pdf',
        fileType: 'pdf',
        fileUrl: '/attachments/1/手术记录.pdf',
        version: 1,
        uploadedBy: '张医生',
        isEvidence: true
      },
      {
        recordId: record1.id,
        nodeId: nodes1[1].id,
        fileName: '产品注册证.pdf',
        fileType: 'pdf',
        fileUrl: '/attachments/1/注册证.pdf',
        version: 1,
        uploadedBy: processor.name,
        isEvidence: true
      }
    ]
  })

  // 4. 创建样本记录 2: 记录漏填 - 处理中
  console.log('📋 创建样本记录 2: 记录漏填...')
  const record2 = await prisma.consumableRecord.create({
    data: {
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
      implantDate: new Date(now.getTime() - 4 * dayMs),
      implantLocation: '右冠状动脉',
      surgeonName: '李主任',
      nurseName: '',
      isAbnormal: true,
      abnormalType: 'MISSING_RECORD',
      abnormalReason: '关键记录缺失',
      blockingReason: '序列号为空，无法追溯产品来源；手术护士姓名未填写，责任链条不完整。',
      remedialPath: '1. 联系手术室调取植入记录，补充耗材序列号；\n2. 确认当班巡回护士信息并补录；\n3. 补充完成后重新提交复核。',
      currentHandlerId: processor.id,
      applicantName: '李主任',
      applyDept: '心内科',
      applyTime: new Date(now.getTime() - 5 * dayMs),
      acceptTime: new Date(now.getTime() - 5 * dayMs + 60 * 60 * 1000),
      version: 1
    }
  })

  // 创建记录2的节点
  const node2Accept = await prisma.reviewNode.create({
    data: {
      recordId: record2.id,
      nodeType: 'ACCEPTANCE',
      nodeStatus: 'COMPLETED',
      nodeName: '受理节点',
      nodeOrder: 1,
      operatorId: processor.id,
      operatorName: processor.name,
      handlerId: processor.id,
      handlerName: processor.name,
      content: '已受理心脏支架植入登记申请，初步审核发现信息不完整。',
      basis: '《高值医用耗材管理规范》',
      createdAt: new Date(now.getTime() - 5 * dayMs + 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 5 * dayMs + 60 * 60 * 1000)
    }
  })

  const node2Process = await prisma.reviewNode.create({
    data: {
      recordId: record2.id,
      nodeType: 'PROCESSING',
      nodeStatus: 'PENDING',
      nodeName: '处理节点',
      nodeOrder: 2,
      handlerId: processor.id,
      handlerName: processor.name,
      content: '正在处理中，已发现记录缺漏，待补充后继续。',
      blockingReason: '序列号为空，无法追溯产品来源；手术护士姓名未填写，责任链条不完整。',
      remedialPath: '1. 联系手术室调取植入记录，补充耗材序列号；\n2. 确认当班巡回护士信息并补录；\n3. 补充完成后重新提交复核。',
      createdAt: new Date(now.getTime() - 5 * dayMs + 2 * 60 * 60 * 1000)
    }
  })

  // 记录2的差异记录
  await prisma.fieldDiff.createMany({
    data: [
      {
        recordId: record2.id,
        nodeId: node2Process.id,
        fieldName: 'serialNo',
        fieldLabel: '耗材序列号',
        oldValue: null,
        newValue: null,
        diffType: 'EVIDENCE_CONCLUSION',
        changedBy: '系统检测'
      },
      {
        recordId: record2.id,
        nodeId: node2Process.id,
        fieldName: 'nurseName',
        fieldLabel: '手术护士',
        oldValue: null,
        newValue: null,
        diffType: 'RESPONSIBLE',
        changedBy: '系统检测'
      }
    ]
  })

  // 记录2的附件
  await prisma.attachment.create({
    data: {
      recordId: record2.id,
      nodeId: node2Process.id,
      fileName: '产品合格证.pdf',
      fileType: 'pdf',
      fileUrl: '/attachments/2/合格证.pdf',
      version: 1,
      uploadedBy: '李主任',
      isEvidence: true
    }
  })

  // 5. 创建样本记录 3: 附件版本不一致 - 待复核
  console.log('📋 创建样本记录 3: 附件版本不一致...')
  const record3 = await prisma.consumableRecord.create({
    data: {
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
      implantDate: new Date(now.getTime() - 2 * dayMs),
      implantLocation: '左眼',
      surgeonName: '陈主任',
      nurseName: '王护士',
      isAbnormal: true,
      abnormalType: 'ATTACHMENT_VERSION_MISMATCH',
      abnormalReason: '附件版本不一致',
      blockingReason: '提交的合格证附件为 v1 版本，而耗材实物标签显示为 v2 版本，版本不一致，无法确认产品合规性。',
      remedialPath: '1. 核对实物标签与系统中附件版本；\n2. 上传最新版本的合格证和质检报告；\n3. 说明版本变更原因并提供厂商证明文件。',
      currentHandlerId: reviewer.id,
      applicantName: '陈主任',
      applyDept: '眼科',
      applyTime: new Date(now.getTime() - 3 * dayMs),
      acceptTime: new Date(now.getTime() - 3 * dayMs + 3 * 60 * 60 * 1000),
      processTime: new Date(now.getTime() - 3 * dayMs + 8 * 60 * 60 * 1000),
      version: 2
    }
  })

  // 创建记录3的节点
  const node3Accept = await prisma.reviewNode.create({
    data: {
      recordId: record3.id,
      nodeType: 'ACCEPTANCE',
      nodeStatus: 'COMPLETED',
      nodeName: '受理节点',
      nodeOrder: 1,
      operatorId: processor.id,
      operatorName: processor.name,
      handlerId: processor.id,
      handlerName: processor.name,
      content: '已受理人工晶状体植入登记申请。',
      basis: '《高值医用耗材管理规范》',
      createdAt: new Date(now.getTime() - 3 * dayMs + 3 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 3 * dayMs + 3 * 60 * 60 * 1000)
    }
  })

  const node3Process = await prisma.reviewNode.create({
    data: {
      recordId: record3.id,
      nodeType: 'PROCESSING',
      nodeStatus: 'COMPLETED',
      nodeName: '处理节点',
      nodeOrder: 2,
      operatorId: processor.id,
      operatorName: processor.name,
      handlerId: processor.id,
      handlerName: processor.name,
      content: '处理完成，已核对基本信息，提交复核。注意：附件版本可能存在差异，请复核时重点关注。',
      basis: '人工晶状体产品注册证、合格证（v1版本）',
      createdAt: new Date(now.getTime() - 3 * dayMs + 4 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 3 * dayMs + 8 * 60 * 60 * 1000)
    }
  })

  const node3Review = await prisma.reviewNode.create({
    data: {
      recordId: record3.id,
      nodeType: 'REVIEW',
      nodeStatus: 'PENDING',
      nodeName: '复核节点',
      nodeOrder: 3,
      handlerId: reviewer.id,
      handlerName: reviewer.name,
      blockingReason: '提交的合格证附件为 v1 版本，而耗材实物标签显示为 v2 版本，版本不一致，无法确认产品合规性。',
      remedialPath: '1. 核对实物标签与系统中附件版本；\n2. 上传最新版本的合格证和质检报告；\n3. 说明版本变更原因并提供厂商证明文件。',
      createdAt: new Date(now.getTime() - 2 * dayMs + 9 * 60 * 60 * 1000)
    }
  })

  // 记录3的差异
  await prisma.fieldDiff.create({
    data: {
      recordId: record3.id,
      nodeId: node3Review.id,
      fieldName: 'attachmentVersion',
      fieldLabel: '合格证附件版本',
      oldValue: 'v1',
      newValue: 'v2',
      diffType: 'EVIDENCE_CONCLUSION',
      changedBy: reviewer.name
    }
  })

  // 记录3的附件
  await prisma.attachment.createMany({
    data: [
      {
        recordId: record3.id,
        nodeId: node3Process.id,
        fileName: '产品合格证.pdf',
        fileType: 'pdf',
        fileUrl: '/attachments/3/合格证_v1.pdf',
        version: 1,
        uploadedBy: '陈主任',
        isEvidence: true
      },
      {
        recordId: record3.id,
        nodeId: node3Process.id,
        fileName: '产品注册证.pdf',
        fileType: 'pdf',
        fileUrl: '/attachments/3/注册证.pdf',
        version: 1,
        uploadedBy: '陈主任',
        isEvidence: true
      }
    ]
  })

  // 6. 创建样本记录 4: 重新处理 - 重新处理中
  console.log('📋 创建样本记录 4: 重新处理...')
  const record4 = await prisma.consumableRecord.create({
    data: {
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
      implantDate: new Date(now.getTime() - 10 * dayMs),
      implantLocation: '右侧顶骨',
      surgeonName: '周主任',
      nurseName: '吴护士',
      isAbnormal: true,
      abnormalType: 'REPROCESS',
      abnormalReason: '复核发现问题，退回重新处理',
      blockingReason: '首次处理时植入时间记录有误（应为上午10:30，记录为下午2:00），且责任护士标注错误，需重新核实后处理。',
      remedialPath: '1. 调阅手术麻醉记录，确认准确植入时间；\n2. 核实实际参与手术的护士名单；\n3. 修改完成后重新提交，并标注修改原因。',
      conclusion: '因关键信息有误，退回重新处理。待信息更正后再行复核。',
      currentHandlerId: processor.id,
      applicantName: '周主任',
      applyDept: '神经外科',
      applyTime: new Date(now.getTime() - 8 * dayMs),
      acceptTime: new Date(now.getTime() - 8 * dayMs + 2 * 60 * 60 * 1000),
      processTime: new Date(now.getTime() - 8 * dayMs + 6 * 60 * 60 * 1000),
      reviewTime: new Date(now.getTime() - 7 * dayMs + 20 * 60 * 60 * 1000),
      reviewBasis: '《高值医用耗材追溯管理办法》第二十五条',
      version: 2
    }
  })

  // 创建记录4的节点（完整流程 + 重新处理）
  const node4Accept = await prisma.reviewNode.create({
    data: {
      recordId: record4.id,
      nodeType: 'ACCEPTANCE',
      nodeStatus: 'COMPLETED',
      nodeName: '受理节点',
      nodeOrder: 1,
      operatorId: processor.id,
      operatorName: processor.name,
      handlerId: processor.id,
      handlerName: processor.name,
      content: '已受理颅骨修复钛网植入登记申请。',
      basis: '《高值医用耗材管理规范》',
      createdAt: new Date(now.getTime() - 8 * dayMs + 2 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 8 * dayMs + 2 * 60 * 60 * 1000)
    }
  })

  const node4Process = await prisma.reviewNode.create({
    data: {
      recordId: record4.id,
      nodeType: 'PROCESSING',
      nodeStatus: 'COMPLETED',
      nodeName: '处理节点（首次）',
      nodeOrder: 2,
      operatorId: processor.id,
      operatorName: processor.name,
      handlerId: processor.id,
      handlerName: processor.name,
      content: '首次处理完成，提交复核。（注：后复核发现问题退回）',
      basis: '颅骨修复钛网产品注册证、合格证',
      createdAt: new Date(now.getTime() - 8 * dayMs + 3 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 8 * dayMs + 6 * 60 * 60 * 1000)
    }
  })

  const node4Review = await prisma.reviewNode.create({
    data: {
      recordId: record4.id,
      nodeType: 'REVIEW',
      nodeStatus: 'REJECTED',
      nodeName: '复核节点（首次）',
      nodeOrder: 3,
      operatorId: reviewer.id,
      operatorName: reviewer.name,
      handlerId: reviewer.id,
      handlerName: reviewer.name,
      content: '复核退回。发现植入时间和责任护士记录有误，需重新核实。',
      basis: '《高值医用耗材追溯管理办法》第二十五条',
      blockingReason: '首次处理时植入时间记录有误（应为上午10:30，记录为下午2:00），且责任护士标注错误，需重新核实后处理。',
      remedialPath: '1. 调阅手术麻醉记录，确认准确植入时间；\n2. 核实实际参与手术的护士名单；\n3. 修改完成后重新提交，并标注修改原因。',
      createdAt: new Date(now.getTime() - 7 * dayMs + 8 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 7 * dayMs + 20 * 60 * 60 * 1000)
    }
  })

  const node4Reprocess = await prisma.reviewNode.create({
    data: {
      recordId: record4.id,
      nodeType: 'REPROCESS',
      nodeStatus: 'PENDING',
      nodeName: '重新处理节点',
      nodeOrder: 4,
      handlerId: processor.id,
      handlerName: processor.name,
      content: '已退回重新处理，请更正植入时间和责任护士信息后再提交。',
      createdAt: new Date(now.getTime() - 7 * dayMs + 21 * 60 * 60 * 1000)
    }
  })

  // 记录4的差异
  await prisma.fieldDiff.createMany({
    data: [
      {
        recordId: record4.id,
        nodeId: node4Review.id,
        fieldName: 'implantDate',
        fieldLabel: '植入时间',
        oldValue: '2024-01-15 14:00',
        newValue: '2024-01-15 10:30',
        diffType: 'KEY_TIME',
        changedBy: reviewer.name
      },
      {
        recordId: record4.id,
        nodeId: node4Review.id,
        fieldName: 'nurseName',
        fieldLabel: '责任护士',
        oldValue: '郑护士',
        newValue: '吴护士',
        diffType: 'RESPONSIBLE',
        changedBy: reviewer.name
      }
    ]
  })

  // 记录4的附件
  await prisma.attachment.createMany({
    data: [
      {
        recordId: record4.id,
        nodeId: node4Process.id,
        fileName: '产品合格证.pdf',
        fileType: 'pdf',
        fileUrl: '/attachments/4/合格证.pdf',
        version: 1,
        uploadedBy: '周主任',
        isEvidence: true
      },
      {
        recordId: record4.id,
        nodeId: node4Process.id,
        fileName: '手术记录单.pdf',
        fileType: 'pdf',
        fileUrl: '/attachments/4/手术记录.pdf',
        version: 1,
        uploadedBy: '周主任',
        isEvidence: true
      }
    ]
  })

  // 7. 创建样本记录 5: 待受理
  console.log('📋 创建样本记录 5: 待受理...')
  const record5 = await prisma.consumableRecord.create({
    data: {
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
      implantDate: new Date(now.getTime() - 1 * dayMs),
      implantLocation: 'L2-L4 椎体',
      surgeonName: '张医生',
      nurseName: '陈护士',
      isAbnormal: false,
      abnormalType: null,
      currentHandlerId: null,
      applicantName: '张医生',
      applyDept: '骨科',
      applyTime: new Date(now.getTime() - 2 * dayMs),
      version: 1
    }
  })

  await prisma.reviewNode.create({
    data: {
      recordId: record5.id,
      nodeType: 'ACCEPTANCE',
      nodeStatus: 'PENDING',
      nodeName: '受理节点',
      nodeOrder: 1,
      handlerId: processor.id,
      handlerName: processor.name,
      createdAt: new Date(now.getTime() - 2 * dayMs)
    }
  })

  // 8. 创建样本记录 6: 复核通过待归档
  console.log('📋 创建样本记录 6: 复核通过待归档...')
  const record6 = await prisma.consumableRecord.create({
    data: {
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
      implantDate: new Date(now.getTime() - 3 * dayMs),
      implantLocation: '直肠',
      surgeonName: '黄主任',
      nurseName: '林护士',
      isAbnormal: false,
      abnormalType: 'NORMAL',
      conclusion: '经复核，耗材信息完整准确，来源可追溯，同意归档。',
      currentHandlerId: archivist.id,
      applicantName: '黄主任',
      applyDept: '普外科',
      applyTime: new Date(now.getTime() - 4 * dayMs),
      acceptTime: new Date(now.getTime() - 4 * dayMs + 60 * 60 * 1000),
      processTime: new Date(now.getTime() - 4 * dayMs + 4 * 60 * 60 * 1000),
      reviewTime: new Date(now.getTime() - 3 * dayMs + 18 * 60 * 60 * 1000),
      reviewBasis: '《医用耗材临床应用管理办法》',
      version: 1
    }
  })

  // 记录6的节点
  await prisma.reviewNode.createMany({
    data: [
      {
        recordId: record6.id,
        nodeType: 'ACCEPTANCE',
        nodeStatus: 'COMPLETED',
        nodeName: '受理节点',
        nodeOrder: 1,
        operatorId: processor.id,
        operatorName: processor.name,
        handlerId: processor.id,
        handlerName: processor.name,
        content: '已受理一次性使用吻合器登记申请。',
        basis: '《高值医用耗材管理规范》',
        createdAt: new Date(now.getTime() - 4 * dayMs + 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 4 * dayMs + 60 * 60 * 1000)
      },
      {
        recordId: record6.id,
        nodeType: 'PROCESSING',
        nodeStatus: 'COMPLETED',
        nodeName: '处理节点',
        nodeOrder: 2,
        operatorId: processor.id,
        operatorName: processor.name,
        handlerId: processor.id,
        handlerName: processor.name,
        content: '处理完成，信息核对无误，提交复核。',
        basis: '吻合器产品注册证、合格证、手术记录',
        createdAt: new Date(now.getTime() - 4 * dayMs + 2 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 4 * dayMs + 4 * 60 * 60 * 1000)
      },
      {
        recordId: record6.id,
        nodeType: 'REVIEW',
        nodeStatus: 'COMPLETED',
        nodeName: '复核节点',
        nodeOrder: 3,
        operatorId: reviewer.id,
        operatorName: reviewer.name,
        handlerId: reviewer.id,
        handlerName: reviewer.name,
        content: '复核通过，耗材信息完整准确，追溯链条清晰，同意归档。',
        basis: '《医用耗材临床应用管理办法》',
        createdAt: new Date(now.getTime() - 3 * dayMs + 5 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 3 * dayMs + 18 * 60 * 60 * 1000)
      },
      {
        recordId: record6.id,
        nodeType: 'ARCHIVE',
        nodeStatus: 'PENDING',
        nodeName: '归档节点',
        nodeOrder: 4,
        handlerId: archivist.id,
        handlerName: archivist.name,
        createdAt: new Date(now.getTime() - 3 * dayMs + 19 * 60 * 60 * 1000)
      }
    ]
  })

  // 记录6的附件
  const nodes6 = await prisma.reviewNode.findMany({
    where: { recordId: record6.id, nodeType: 'PROCESSING' }
  })
  if (nodes6.length > 0) {
    await prisma.attachment.createMany({
      data: [
        {
          recordId: record6.id,
          nodeId: nodes6[0].id,
          fileName: '产品合格证.pdf',
          fileType: 'pdf',
          fileUrl: '/attachments/6/合格证.pdf',
          version: 1,
          uploadedBy: '黄主任',
          isEvidence: true
        },
        {
          recordId: record6.id,
          nodeId: nodes6[0].id,
          fileName: '手术记录单.pdf',
          fileType: 'pdf',
          fileUrl: '/attachments/6/手术记录.pdf',
          version: 1,
          uploadedBy: '黄主任',
          isEvidence: true
        }
      ]
    })
  }

  console.log('\n✅ 所有种子数据创建成功！')
  console.log('========================================')
  console.log('📊 数据统计：')
  console.log('  - 总记录数: 6 条')
  console.log('  - 正常核销: 2 条（GZ-2024-0001、GZ-2024-0006）')
  console.log('  - 记录漏填: 1 条（GZ-2024-0002）')
  console.log('  - 附件版本不一致: 1 条（GZ-2024-0003）')
  console.log('  - 重新处理: 1 条（GZ-2024-0004）')
  console.log('  - 待受理: 1 条（GZ-2024-0005）')
  console.log('========================================')
  console.log('👤 用户账号：')
  console.log('  - 申请人: 张医生 (骨科)')
  console.log('  - 处理人: 李护士 (耗材科)')
  console.log('  - 复核人: 王主任 (医务科)')
  console.log('  - 归档人: 赵档案 (病案室)')
  console.log('========================================')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
