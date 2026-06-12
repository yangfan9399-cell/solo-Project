import pkg from '@prisma/client'

const _pkg: any = pkg
const PrismaClient: any = _pkg.PrismaClient
const RecordStatus: any = _pkg.RecordStatus
const NodeType: any = _pkg.NodeType
const UserRole: any = _pkg.UserRole
const SampleType: any = _pkg.SampleType

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  const applicant1 = await prisma.user.upsert({
    where: { id: 'user-applicant-1' },
    update: {},
    create: {
      id: 'user-applicant-1',
      name: '张三',
      role: UserRole.APPLICANT
    }
  })

  const applicant2 = await prisma.user.upsert({
    where: { id: 'user-applicant-2' },
    update: {},
    create: {
      id: 'user-applicant-2',
      name: '李四',
      role: UserRole.APPLICANT
    }
  })

  const reviewer1 = await prisma.user.upsert({
    where: { id: 'user-reviewer-1' },
    update: {},
    create: {
      id: 'user-reviewer-1',
      name: '王复核',
      role: UserRole.REVIEWER
    }
  })

  const admin = await prisma.user.upsert({
    where: { id: 'user-admin-1' },
    update: {},
    create: {
      id: 'user-admin-1',
      name: '赵管理',
      role: UserRole.ADMIN
    }
  })

  const station1 = await prisma.pumpStation.upsert({
    where: { id: 'station-1' },
    update: {},
    create: {
      id: 'station-1',
      name: '城东排水泵站',
      code: 'CD-PS-001',
      location: '城东区排水大道123号',
      description: '服务城东片区50万人口，配备4台主排水泵'
    }
  })

  const station2 = await prisma.pumpStation.upsert({
    where: { id: 'station-2' },
    update: {},
    create: {
      id: 'station-2',
      name: '城西排水泵站',
      code: 'CX-PS-002',
      location: '城西区防汛路456号',
      description: '服务城西片区30万人口，配备3台主排水泵'
    }
  })

  const station3 = await prisma.pumpStation.upsert({
    where: { id: 'station-3' },
    update: {},
    create: {
      id: 'station-3',
      name: '城南排水泵站',
      code: 'CN-PS-003',
      location: '城南区排水路789号',
      description: '服务城南工业区，配备5台主排水泵'
    }
  })

  await prisma.alarmRecord.deleteMany()
  await prisma.recordNode.deleteMany()
  await prisma.fieldDiff.deleteMany()
  await prisma.attachment.deleteMany()

  await seedNormalVerification(
    'station-1',
    'user-applicant-1',
    '张三',
    'user-reviewer-1',
    '王复核'
  )

  await seedMissingFields(
    'station-1',
    'user-applicant-2',
    '李四',
    'user-reviewer-1',
    '王复核'
  )

  await seedAttachmentMismatch(
    'station-2',
    'user-applicant-1',
    '张三',
    'user-reviewer-1',
    '王复核'
  )

  await seedReprocess(
    'station-3',
    'user-applicant-2',
    '李四',
    'user-reviewer-1',
    '王复核'
  )

  console.log('Seeding completed!')
}

async function createRecordWithNodes(recordData: any, nodes: any[] = [], fieldDiffs: any[] = []) {
  const cleanRecordData: any = { ...recordData }
  if (cleanRecordData.station && cleanRecordData.station.connect) {
    cleanRecordData.stationId = cleanRecordData.station.connect.id
    delete cleanRecordData.station
  }
  if (cleanRecordData.currentHandler && cleanRecordData.currentHandler.connect) {
    cleanRecordData.currentHandlerId = cleanRecordData.currentHandler.connect.id
    delete cleanRecordData.currentHandler
  }

  const record = await prisma.alarmRecord.create({
    data: cleanRecordData
  })

  for (const nodeData of nodes) {
    const cleanNodeData: any = { ...nodeData }
    if (cleanNodeData.record && cleanNodeData.record.connect) {
      cleanNodeData.recordId = record.id
      delete cleanNodeData.record
    }

    const nodeAttachments = cleanNodeData.attachments
    const nodeFieldDiffs = cleanNodeData.fieldDiffs
    delete cleanNodeData.attachments
    delete cleanNodeData.fieldDiffs
    delete cleanNodeData.updatedAt

    const createdNode = await prisma.recordNode.create({
      data: cleanNodeData
    })

    if (nodeAttachments && nodeAttachments.create) {
      const attList: any[] = Array.isArray(nodeAttachments.create)
        ? nodeAttachments.create
        : [nodeAttachments.create]

      for (const att of attList) {
        await prisma.attachment.create({
          data: {
            ...att,
            recordId: record.id,
            nodeId: createdNode.id
          }
        })
      }
    }

    if (nodeFieldDiffs && nodeFieldDiffs.create) {
      const diffList: any[] = Array.isArray(nodeFieldDiffs.create)
        ? nodeFieldDiffs.create
        : [nodeFieldDiffs.create]

      for (const diff of diffList) {
        await prisma.fieldDiff.create({
          data: {
            ...diff,
            recordId: record.id,
            nodeId: createdNode.id
          }
        })
      }
    }
  }

  for (const diff of fieldDiffs) {
    await prisma.fieldDiff.create({
      data: {
        ...diff,
        recordId: record.id
      }
    })
  }

  return record
}

async function seedNormalVerification(stationId: string, applicantId: string, applicantName: string, reviewerId: string, reviewerName: string) {
  const now = new Date()
  const t0 = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)
  const t1 = new Date(t0.getTime() + 25 * 60 * 1000)
  const t2 = new Date(t1.getTime() + 3 * 60 * 60 * 1000)
  const t3 = new Date(t2.getTime() + 1 * 60 * 60 * 1000)

  const occurrenceTime = new Date(t0.getTime() - 45 * 60 * 1000)

  const record = await createRecordWithNodes(
    {
      id: 'record-normal-001',
      recordNo: 'PS-ALARM-2026-0610-001',
      title: '1#泵电流异常告警',
      description: '1#主排水泵运行电流超出正常范围，达到58A（额定45A）',
      source: 'SCADA自动监测系统',
      sampleType: SampleType.NORMAL_VERIFICATION,
      status: RecordStatus.ARCHIVED,
      stationId,
      currentHandlerId: reviewerId,
      keyObject: '1#主排水泵',
      occurrenceTime,
      amount: 5000,
      evidenceConclusion: '复核通过：处理流程规范，证据充分',
      isArchived: true,
      archivedAt: t3,
      archivedBy: reviewerName,
      createdAt: t0,
      updatedAt: t3
    },
    [
      {
        id: 'node-normal-001-accept',
        recordId: 'record-normal-001',
        nodeType: NodeType.ACCEPT,
        operatorId: applicantId,
        operatorName: applicantName,
        remark: '系统自动告警已确认，1#泵电流58A，温度87°C，疑似轴承磨损',
        beforeSnapshot: {},
        afterSnapshot: {
          title: '1#泵电流异常告警',
          description: '1#主排水泵运行电流超出正常范围，达到58A（额定45A）',
          source: 'SCADA自动监测系统',
          keyObject: '1#主排水泵',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '5000',
          evidenceConclusion: '待确认'
        },
        attachments: {
          create: [
            {
              id: 'att-normal-001-scada',
              name: 'SCADA电流监测截图.png',
              url: '/attachments/SCADA电流监测截图.png',
              version: 'V1.0',
              fileType: 'image/png',
              size: 1024000,
              uploadedBy: applicantName
            }
          ]
        },
        createdAt: t0,
        updatedAt: t0
      },
      {
        id: 'node-normal-001-process',
        recordId: 'record-normal-001',
        nodeType: NodeType.PROCESS,
        operatorId: applicantId,
        operatorName: applicantName,
        remark: '已联系维修班组更换轴承，更换后测试电流稳定在42A，温度降至65°C',
        beforeSnapshot: {
          title: '1#泵电流异常告警',
          description: '1#主排水泵运行电流超出正常范围，达到58A（额定45A）',
          source: 'SCADA自动监测系统',
          keyObject: '1#主排水泵',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '5000',
          evidenceConclusion: '待确认'
        },
        afterSnapshot: {
          title: '1#泵电流异常告警',
          description: '1#主排水泵运行电流超出正常范围，达到58A（额定45A）',
          source: 'SCADA自动监测系统',
          keyObject: '1#主排水泵',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '5000',
          evidenceConclusion: '已处理：更换轴承，电流恢复正常'
        },
        fieldDiffs: {
          create: [
            {
              id: 'diff-normal-001-evidence',
              fieldName: 'evidenceConclusion',
              fieldLabel: '证据结论',
              oldValue: '待确认',
              newValue: '已处理：更换轴承，电流恢复正常',
              diffType: 'conclusion'
            }
          ]
        },
        attachments: {
          create: [
            {
              id: 'att-normal-001-repair',
              name: '维修现场照片.jpg',
              url: '/attachments/维修现场照片.jpg',
              version: 'V1.0',
              fileType: 'image/jpeg',
              size: 2048000,
              uploadedBy: applicantName
            },
            {
              id: 'att-normal-001-after',
              name: '更换后SCADA数据.png',
              url: '/attachments/更换后SCADA数据.png',
              version: 'V1.0',
              fileType: 'image/png',
              size: 896000,
              uploadedBy: applicantName
            }
          ]
        },
        createdAt: t1,
        updatedAt: t1
      },
      {
        id: 'node-normal-001-review',
        recordId: 'record-normal-001',
        nodeType: NodeType.REVIEW,
        operatorId: reviewerId,
        operatorName: reviewerName,
        remark: '证据完整、流程合规、责任人明确，同意归档',
        beforeSnapshot: {
          title: '1#泵电流异常告警',
          description: '1#主排水泵运行电流超出正常范围，达到58A（额定45A）',
          source: 'SCADA自动监测系统',
          keyObject: '1#主排水泵',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '5000',
          evidenceConclusion: '已处理：更换轴承，电流恢复正常'
        },
        afterSnapshot: {
          title: '1#泵电流异常告警',
          description: '1#主排水泵运行电流超出正常范围，达到58A（额定45A）',
          source: 'SCADA自动监测系统',
          keyObject: '1#主排水泵',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '5000',
          evidenceConclusion: '复核通过：处理流程规范，证据充分'
        },
        fieldDiffs: {
          create: [
            {
              id: 'diff-normal-001-review-evidence',
              fieldName: 'evidenceConclusion',
              fieldLabel: '证据结论',
              oldValue: '已处理：更换轴承，电流恢复正常',
              newValue: '复核通过：处理流程规范，证据充分',
              diffType: 'conclusion'
            }
          ]
        },
        createdAt: t2,
        updatedAt: t2
      },
      {
        id: 'node-normal-001-archive',
        recordId: 'record-normal-001',
        nodeType: NodeType.ARCHIVE,
        operatorId: reviewerId,
        operatorName: reviewerName,
        remark: '正常核销归档，符合《排水泵站运维管理规程》第12.3条处置标准',
        beforeSnapshot: {
          title: '1#泵电流异常告警',
          description: '1#主排水泵运行电流超出正常范围，达到58A（额定45A）',
          source: 'SCADA自动监测系统',
          keyObject: '1#主排水泵',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '5000',
          evidenceConclusion: '复核通过：处理流程规范，证据充分'
        },
        afterSnapshot: {
          title: '1#泵电流异常告警',
          description: '1#主排水泵运行电流超出正常范围，达到58A（额定45A）',
          source: 'SCADA自动监测系统',
          keyObject: '1#主排水泵',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '5000',
          evidenceConclusion: '复核通过：处理流程规范，证据充分'
        },
        createdAt: t3,
        updatedAt: t3
      }
    ]
  )

  console.log(`Created normal verification record: ${record.recordNo}`)
  return record
}

async function seedMissingFields(stationId: string, applicantId: string, applicantName: string, reviewerId: string, reviewerName: string) {
  const now = new Date()
  const t0 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  const t1 = new Date(t0.getTime() + 5 * 60 * 60 * 1000)
  const t2 = new Date(t1.getTime() + 1 * 60 * 60 * 1000)

  const occurrenceTime = new Date(t0.getTime() - 30 * 60 * 1000)

  const record = await createRecordWithNodes(
    {
      id: 'record-missing-002',
      recordNo: 'PS-ALARM-2026-0611-002',
      title: '液位计通信中断',
      description: '3#液位计持续3小时无数据上传，中控室无法监测集水井水位',
      source: '运维巡检上报',
      sampleType: SampleType.MISSING_FIELDS,
      status: RecordStatus.REJECTED,
      stationId,
      currentHandlerId: applicantId,
      keyObject: '3#液位计',
      occurrenceTime,
      amount: 3000,
      evidenceConclusion: '待补充：缺失维修工单编号、更换配件清单',
      isArchived: false,
      createdAt: t0,
      updatedAt: t2
    },
    [
      {
        id: 'node-missing-002-accept',
        recordId: 'record-missing-002',
        nodeType: NodeType.ACCEPT,
        operatorId: applicantId,
        operatorName: applicantName,
        remark: '巡检发现3#液位计电源指示灯正常，但通信指示灯不亮，判断为通信模块故障',
        beforeSnapshot: {},
        afterSnapshot: {
          title: '液位计通信中断',
          description: '3#液位计持续3小时无数据上传',
          source: '运维巡检上报',
          keyObject: '3#液位计',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '3000',
          evidenceConclusion: '待确认'
        },
        attachments: {
          create: [
            {
              id: 'att-missing-002-check',
              name: '巡检记录照片.jpg',
              url: '/attachments/巡检记录照片.jpg',
              version: 'V1.0',
              fileType: 'image/jpeg',
              size: 1536000,
              uploadedBy: applicantName
            }
          ]
        },
        createdAt: t0,
        updatedAt: t0
      },
      {
        id: 'node-missing-002-process',
        recordId: 'record-missing-002',
        nodeType: NodeType.PROCESS,
        operatorId: applicantId,
        operatorName: applicantName,
        remark: '已更换通信模块，但未填写维修工单',
        beforeSnapshot: {
          title: '液位计通信中断',
          description: '3#液位计持续3小时无数据上传',
          source: '运维巡检上报',
          keyObject: '3#液位计',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '3000',
          evidenceConclusion: '待确认'
        },
        afterSnapshot: {
          title: '液位计通信中断',
          description: '3#液位计持续3小时无数据上传',
          source: '运维巡检上报',
          keyObject: '3#液位计',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '3000',
          evidenceConclusion: '液位计通信恢复正常，但证据不完整'
        },
        fieldDiffs: {
          create: [
            {
              id: 'diff-missing-002-evidence',
              fieldName: 'evidenceConclusion',
              fieldLabel: '证据结论',
              oldValue: '待确认',
              newValue: '液位计通信恢复正常，但证据不完整',
              diffType: 'conclusion'
            }
          ]
        },
        attachments: {
          create: [
            {
              id: 'att-missing-002-after',
              name: '更换后液位计数据.png',
              url: '/attachments/更换后液位计数据.png',
              version: 'V1.0',
              fileType: 'image/png',
              size: 512000,
              uploadedBy: applicantName
            }
          ]
        },
        createdAt: t1,
        updatedAt: t1
      },
      {
        id: 'node-missing-002-reject',
        recordId: 'record-missing-002',
        nodeType: NodeType.REJECT,
        operatorId: reviewerId,
        operatorName: reviewerName,
        remark: '退回补证：关键证据缺失',
        blockReason: '1. 缺少维修工单编号，无法追溯费用审批流程\n2. 缺少更换配件清单，3000元支出无明细支撑\n3. 缺少现场负责人签字确认的交接记录',
        remedyPath: '第一步：登录运维系统，关联本次维修对应的工单编号 WO-20260611-0037\n第二步：补充更换配件清单（通信模块型号、采购渠道、单价和数量）\n第三步：补填《设备维修交接确认单》，由现场负责人王建国签字扫描后上传\n第四步：补充完成后，在处理台选择「补充资料」重新提交复核',
        beforeSnapshot: {
          title: '液位计通信中断',
          description: '3#液位计持续3小时无数据上传',
          source: '运维巡检上报',
          keyObject: '3#液位计',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '3000',
          evidenceConclusion: '液位计通信恢复正常，但证据不完整'
        },
        afterSnapshot: {
          title: '液位计通信中断',
          description: '3#液位计持续3小时无数据上传',
          source: '运维巡检上报',
          keyObject: '3#液位计',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '3000',
          evidenceConclusion: '待补充：缺失维修工单编号、更换配件清单'
        },
        fieldDiffs: {
          create: [
            {
              id: 'diff-missing-002-reject-evidence',
              fieldName: 'evidenceConclusion',
              fieldLabel: '证据结论',
              oldValue: '液位计通信恢复正常，但证据不完整',
              newValue: '待补充：缺失维修工单编号、更换配件清单',
              diffType: 'conclusion'
            }
          ]
        },
        createdAt: t2,
        updatedAt: t2
      }
    ]
  )

  console.log(`Created missing fields record: ${record.recordNo}`)
  return record
}

async function seedAttachmentMismatch(stationId: string, applicantId: string, applicantName: string, reviewerId: string, reviewerName: string) {
  const now = new Date()
  const t0 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const t1 = new Date(t0.getTime() + 6 * 60 * 60 * 1000)
  const t2 = new Date(t1.getTime() + 1 * 60 * 60 * 1000)

  const occurrenceTime = new Date(t0.getTime() - 20 * 60 * 1000)

  const record = await createRecordWithNodes(
    {
      id: 'record-mismatch-003',
      recordNo: 'PS-ALARM-2026-0612-003',
      title: '格栅机过载停机',
      description: '2#格栅机连续3次过载跳闸，电机温度高达105°C，疑似被硬物缠绕',
      source: '设备报警系统',
      sampleType: SampleType.ATTACHMENT_MISMATCH,
      status: RecordStatus.REJECTED,
      stationId,
      currentHandlerId: applicantId,
      keyObject: '2#格栅机',
      occurrenceTime,
      amount: 8000,
      evidenceConclusion: '待更正：附件版本不一致，需重新上传',
      isArchived: false,
      createdAt: t0,
      updatedAt: t2
    },
    [
      {
        id: 'node-mismatch-003-accept',
        recordId: 'record-mismatch-003',
        nodeType: NodeType.ACCEPT,
        operatorId: applicantId,
        operatorName: applicantName,
        remark: '现场检查发现格栅机被建筑废料缠绕，电机过热保护已触发，需人工清理',
        beforeSnapshot: {},
        afterSnapshot: {
          title: '格栅机过载停机',
          description: '2#格栅机连续3次过载跳闸',
          source: '设备报警系统',
          keyObject: '2#格栅机',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '8000',
          evidenceConclusion: '待确认'
        },
        attachments: {
          create: [
            {
              id: 'att-mismatch-003-scada',
              name: '格栅机过载曲线-V1.png',
              url: '/attachments/格栅机过载曲线-V1.png',
              version: 'V1.0',
              fileType: 'image/png',
              size: 768000,
              uploadedBy: applicantName
            }
          ]
        },
        createdAt: t0,
        updatedAt: t0
      },
      {
        id: 'node-mismatch-003-process',
        recordId: 'record-mismatch-003',
        nodeType: NodeType.PROCESS,
        operatorId: applicantId,
        operatorName: applicantName,
        remark: '已清理缠绕物并更换磨损齿耙，测试运行正常，但上传了未更新版本的检测报告',
        beforeSnapshot: {
          title: '格栅机过载停机',
          description: '2#格栅机连续3次过载跳闸',
          source: '设备报警系统',
          keyObject: '2#格栅机',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '8000',
          evidenceConclusion: '待确认'
        },
        afterSnapshot: {
          title: '格栅机过载停机',
          description: '2#格栅机连续3次过载跳闸',
          source: '设备报警系统',
          keyObject: '2#格栅机',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '8000',
          evidenceConclusion: '已完成清理和更换，附件版本不一致'
        },
        fieldDiffs: {
          create: [
            {
              id: 'diff-mismatch-003-evidence',
              fieldName: 'evidenceConclusion',
              fieldLabel: '证据结论',
              oldValue: '待确认',
              newValue: '已完成清理和更换，附件版本不一致',
              diffType: 'conclusion'
            }
          ]
        },
        attachments: {
          create: [
            {
              id: 'att-mismatch-003-site',
              name: '清理现场照片.jpg',
              url: '/attachments/清理现场照片.jpg',
              version: 'V1.0',
              fileType: 'image/jpeg',
              size: 2816000,
              uploadedBy: applicantName
            },
            {
              id: 'att-mismatch-003-report-v1',
              name: '设备检测报告-V2.docx',
              url: '/attachments/设备检测报告-V2.docx',
              version: 'V2.0',
              fileType: 'application/docx',
              size: 256000,
              uploadedBy: applicantName
            }
          ]
        },
        createdAt: t1,
        updatedAt: t1
      },
      {
        id: 'node-mismatch-003-reject',
        recordId: 'record-mismatch-003',
        nodeType: NodeType.REJECT,
        operatorId: reviewerId,
        operatorName: reviewerName,
        remark: '退回更正：检测报告版本与业务记录不匹配',
        blockReason: '1. 业务记录中「检测报告」提及「更换3根齿耙，其中2根型号GR-21，1根型号GR-25」\n   但附件「设备检测报告-V2.docx」中仍写为「更换3根GR-21齿耙」，数量和型号均不一致\n2. 附件版本号V2与SCADA电流曲线V1不匹配（应同步更新为V2）\n3. 检测报告MD5校验值 d41d8cd9 与运维系统中存档版本 9e107d9d 不一致，存在上传旧版本文件风险',
        remedyPath: '第一步：打开「设备检测报告-V2.docx」，将齿耙型号及数量更正为3根（2根GR-21 + 1根GR-25），版本号更新为V3\n第二步：重新导出SCADA电流曲线（含清理后2小时运行数据），版本号统一为V3\n第三步：使用系统「附件版本校验工具」生成MD5校验值，并在备注中注明\n第四步：将全部V3版本附件在处理台通过「补充资料」功能重新上传，确保版本号与业务描述完全一致',
        beforeSnapshot: {
          title: '格栅机过载停机',
          description: '2#格栅机连续3次过载跳闸',
          source: '设备报警系统',
          keyObject: '2#格栅机',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '8000',
          evidenceConclusion: '已完成清理和更换，附件版本不一致'
        },
        afterSnapshot: {
          title: '格栅机过载停机',
          description: '2#格栅机连续3次过载跳闸',
          source: '设备报警系统',
          keyObject: '2#格栅机',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '8000',
          evidenceConclusion: '待更正：附件版本不一致，需重新上传'
        },
        fieldDiffs: {
          create: [
            {
              id: 'diff-mismatch-003-report-evidence',
              fieldName: 'evidenceConclusion',
              fieldLabel: '证据结论',
              oldValue: '已完成清理和更换，附件版本不一致',
              newValue: '待更正：附件版本不一致，需重新上传',
              diffType: 'conclusion'
            }
          ]
        },
        createdAt: t2,
        updatedAt: t2
      }
    ]
  )

  console.log(`Created attachment mismatch record: ${record.recordNo}`)
  return record
}

async function seedReprocess(stationId: string, applicantId: string, applicantName: string, reviewerId: string, reviewerName: string) {
  const now = new Date()
  const t0 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  const t1 = new Date(t0.getTime() + 2 * 60 * 60 * 1000)
  const t2 = new Date(t1.getTime() + 1 * 60 * 60 * 1000)
  const t3 = new Date(t2.getTime() + 1 * 60 * 60 * 1000)
  const t4 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
  const t5 = new Date(t4.getTime() + 3 * 60 * 60 * 1000)
  const t6 = new Date(now.getTime() - 12 * 60 * 60 * 1000)

  const occurrenceTime = new Date(t0.getTime() - 1 * 60 * 60 * 1000)
  const updatedOccurrenceTime = new Date(t0.getTime() - 2 * 60 * 60 * 1000)

  const record = await createRecordWithNodes(
    {
      id: 'record-reprocess-004',
      recordNo: 'PS-ALARM-2026-0609-004',
      title: '暴雨期间集水井溢流',
      description: '暴雨橙色预警期间集水井最高水位达8.2米，超过设计警戒水位（7.5米），发生溢流约45分钟',
      source: '市民热线转办',
      sampleType: SampleType.REPROCESS,
      status: RecordStatus.REOPENED,
      stationId,
      currentHandlerId: reviewerId,
      keyObject: '集水井+3#水泵联动系统',
      occurrenceTime: updatedOccurrenceTime,
      amount: 25000,
      evidenceConclusion: '重新处理：责任对象及金额已修正，待补充完整损失评估报告',
      isArchived: false,
      createdAt: t0,
      updatedAt: t6
    },
    [
      {
        id: 'node-reprocess-004-accept',
        recordId: 'record-reprocess-004',
        nodeType: NodeType.ACCEPT,
        operatorId: applicantId,
        operatorName: applicantName,
        remark: '市民反映排水口倒灌，经现场核实集水井溢流，初步评估损失约15000元',
        beforeSnapshot: {},
        afterSnapshot: {
          title: '暴雨期间集水井溢流',
          description: '集水井水位超警戒线',
          source: '市民热线转办',
          keyObject: '集水井',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '15000',
          evidenceConclusion: '待确认'
        },
        attachments: {
          create: [
            {
              id: 'att-reprocess-004-site',
              name: '溢流现场视频截图.png',
              url: '/attachments/溢流现场视频截图.png',
              version: 'V1.0',
              fileType: 'image/png',
              size: 1664000,
              uploadedBy: applicantName
            }
          ]
        },
        createdAt: t0,
        updatedAt: t0
      },
      {
        id: 'node-reprocess-004-process',
        recordId: 'record-reprocess-004',
        nodeType: NodeType.PROCESS,
        operatorId: applicantId,
        operatorName: applicantName,
        remark: '启动应急排水预案，加开备用泵组，水位已恢复正常。损失金额15000元为周边道路清淤费用',
        beforeSnapshot: {
          title: '暴雨期间集水井溢流',
          description: '集水井水位超警戒线',
          source: '市民热线转办',
          keyObject: '集水井',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '15000',
          evidenceConclusion: '待确认'
        },
        afterSnapshot: {
          title: '暴雨期间集水井溢流',
          description: '集水井水位超警戒线',
          source: '市民热线转办',
          keyObject: '集水井',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '15000',
          evidenceConclusion: '已处理：水位恢复，损失15000元'
        },
        fieldDiffs: {
          create: [
            {
              id: 'diff-reprocess-004-process-evidence',
              fieldName: 'evidenceConclusion',
              fieldLabel: '证据结论',
              oldValue: '待确认',
              newValue: '已处理：水位恢复，损失15000元',
              diffType: 'conclusion'
            }
          ]
        },
        attachments: {
          create: [
            {
              id: 'att-reprocess-004-after',
              name: '恢复后水位监控图.png',
              url: '/attachments/恢复后水位监控图.png',
              version: 'V1.0',
              fileType: 'image/png',
              size: 640000,
              uploadedBy: applicantName
            }
          ]
        },
        createdAt: t1,
        updatedAt: t1
      },
      {
        id: 'node-reprocess-004-review',
        recordId: 'record-reprocess-004',
        nodeType: NodeType.REVIEW,
        operatorId: reviewerId,
        operatorName: reviewerName,
        remark: '初步通过，按当时提交资料归档',
        beforeSnapshot: {
          title: '暴雨期间集水井溢流',
          description: '集水井水位超警戒线',
          source: '市民热线转办',
          keyObject: '集水井',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '15000',
          evidenceConclusion: '已处理：水位恢复，损失15000元'
        },
        afterSnapshot: {
          title: '暴雨期间集水井溢流',
          description: '集水井水位超警戒线',
          source: '市民热线转办',
          keyObject: '集水井',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '15000',
          evidenceConclusion: '复核通过：处理及时，措施有效'
        },
        fieldDiffs: {
          create: [
            {
              id: 'diff-reprocess-004-review-evidence',
              fieldName: 'evidenceConclusion',
              fieldLabel: '证据结论',
              oldValue: '已处理：水位恢复，损失15000元',
              newValue: '复核通过：处理及时，措施有效',
              diffType: 'conclusion'
            }
          ]
        },
        createdAt: t2,
        updatedAt: t2
      },
      {
        id: 'node-reprocess-004-archive',
        recordId: 'record-reprocess-004',
        nodeType: NodeType.ARCHIVE,
        operatorId: reviewerId,
        operatorName: reviewerName,
        remark: '归档完成',
        beforeSnapshot: {
          title: '暴雨期间集水井溢流',
          description: '集水井水位超警戒线',
          source: '市民热线转办',
          keyObject: '集水井',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '15000',
          evidenceConclusion: '复核通过：处理及时，措施有效'
        },
        afterSnapshot: {
          title: '暴雨期间集水井溢流',
          description: '集水井水位超警戒线',
          source: '市民热线转办',
          keyObject: '集水井',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '15000',
          evidenceConclusion: '复核通过：处理及时，措施有效'
        },
        createdAt: t3,
        updatedAt: t3
      },
      {
        id: 'node-reprocess-004-reopen',
        recordId: 'record-reprocess-004',
        nodeType: NodeType.REOPEN,
        operatorId: reviewerId,
        operatorName: reviewerName,
        remark: '归档后重新处理：发现原始资料中责任对象、金额数量及发生时间均存在重大误差',
        blockReason: '1. 经审计发现，本起事件原始申报存在3处关键信息偏差：\n   (1) 责任对象申报为「集水井」，但实际为「集水井+3#水泵联动系统」联动故障，3#泵未按预案启动为主要原因\n   (2) 损失金额申报为15000元，但市民财产理赔登记系统显示，实际赔偿金额为25000元（含1户商铺、3户居民）\n   (3) 发生时间申报为22:30，但监控视频显示21:15已出现溢流苗头，时间误差约75分钟\n2. 以上3项均属于关键信息偏差，按《排水泵站运维审计规程》第28条，必须重新处理并修正原始记录',
        remedyPath: '第一步：在处理台将责任对象从「集水井」更正为「集水井+3#水泵联动系统」\n第二步：将损失金额从15000元更正为25000元，并上传《市民财产理赔明细汇总表》\n第三步：将发生时间从22:30更正为21:15（基于监控视频时间戳），并补充视频截图证据\n第四步：补充「3#水泵未自动启动原因分析报告」，明确责任归属\n第五步：全部资料补充完成后，复核人需生成「重新处理差异对照表」作为归档附件',
        beforeSnapshot: {
          title: '暴雨期间集水井溢流',
          description: '集水井水位超警戒线',
          source: '市民热线转办',
          keyObject: '集水井',
          occurrenceTime: occurrenceTime.toISOString(),
          amount: '15000',
          evidenceConclusion: '复核通过：处理及时，措施有效'
        },
        afterSnapshot: {
          title: '暴雨期间集水井溢流',
          description: '暴雨橙色预警期间集水井最高水位达8.2米，超过设计警戒水位（7.5米），发生溢流约45分钟',
          source: '市民热线转办',
          keyObject: '集水井+3#水泵联动系统',
          occurrenceTime: updatedOccurrenceTime.toISOString(),
          amount: '25000',
          evidenceConclusion: '重新处理：责任对象及金额已修正，待补充完整损失评估报告'
        },
        fieldDiffs: {
          create: [
            {
              id: 'diff-reprocess-004-reopen-time',
              fieldName: 'occurrenceTime',
              fieldLabel: '发生时间',
              oldValue: occurrenceTime.toISOString(),
              newValue: updatedOccurrenceTime.toISOString(),
              diffType: 'time'
            },
            {
              id: 'diff-reprocess-004-reopen-object',
              fieldName: 'keyObject',
              fieldLabel: '责任对象',
              oldValue: '集水井',
              newValue: '集水井+3#水泵联动系统',
              diffType: 'object'
            },
            {
              id: 'diff-reprocess-004-reopen-amount',
              fieldName: 'amount',
              fieldLabel: '金额数量',
              oldValue: '15000',
              newValue: '25000',
              diffType: 'amount'
            },
            {
              id: 'diff-reprocess-004-reopen-evidence',
              fieldName: 'evidenceConclusion',
              fieldLabel: '证据结论',
              oldValue: '复核通过：处理及时，措施有效',
              newValue: '重新处理：责任对象及金额已修正，待补充完整损失评估报告',
              diffType: 'conclusion'
            }
          ]
        },
        attachments: {
          create: [
            {
              id: 'att-reprocess-004-audit',
              name: '审计差异对比报告-V3.pdf',
              url: '/attachments/审计差异对比报告-V3.pdf',
              version: 'V3.0',
              fileType: 'application/pdf',
              size: 2048000,
              uploadedBy: reviewerName
            },
            {
              id: 'att-reprocess-004-compensate',
              name: '市民财产理赔明细.xlsx',
              url: '/attachments/市民财产理赔明细.xlsx',
              version: 'V1.0',
              fileType: 'application/vnd.ms-excel',
              size: 128000,
              uploadedBy: reviewerName
            }
          ]
        },
        createdAt: t4,
        updatedAt: t4
      },
      {
        id: 'node-reprocess-004-supplement',
        recordId: 'record-reprocess-004',
        nodeType: NodeType.SUPPLEMENT,
        operatorId: applicantId,
        operatorName: applicantName,
        remark: '已按重新处理要求补充业务记录和现场说明，关键字段已同步更正',
        beforeSnapshot: {
          title: '暴雨期间集水井溢流',
          description: '暴雨橙色预警期间集水井最高水位达8.2米，超过设计警戒水位（7.5米），发生溢流约45分钟',
          source: '市民热线转办',
          keyObject: '集水井+3#水泵联动系统',
          occurrenceTime: updatedOccurrenceTime.toISOString(),
          amount: '25000',
          evidenceConclusion: '重新处理：责任对象及金额已修正，待补充完整损失评估报告'
        },
        afterSnapshot: {
          title: '暴雨期间集水井溢流',
          description: '暴雨橙色预警期间集水井最高水位达8.2米，超过设计警戒水位（7.5米），发生溢流约45分钟',
          source: '市民热线转办',
          keyObject: '集水井+3#水泵联动系统',
          occurrenceTime: updatedOccurrenceTime.toISOString(),
          amount: '25000',
          evidenceConclusion: '重新处理：已补充3#泵故障分析报告，待复核'
        },
        fieldDiffs: {
          create: [
            {
              id: 'diff-reprocess-004-supplement-evidence',
              fieldName: 'evidenceConclusion',
              fieldLabel: '证据结论',
              oldValue: '重新处理：责任对象及金额已修正，待补充完整损失评估报告',
              newValue: '重新处理：已补充3#泵故障分析报告，待复核',
              diffType: 'conclusion'
            }
          ]
        },
        attachments: {
          create: [
            {
              id: 'att-reprocess-004-analysis',
              name: '3#水泵未启动原因分析报告-V2.docx',
              url: '/attachments/3#水泵未启动原因分析报告-V2.docx',
              version: 'V2.0',
              fileType: 'application/docx',
              size: 512000,
              uploadedBy: applicantName
            }
          ]
        },
        createdAt: t5,
        updatedAt: t5
      },
      {
        id: 'node-reprocess-004-process2',
        recordId: 'record-reprocess-004',
        nodeType: NodeType.PROCESS,
        operatorId: applicantId,
        operatorName: applicantName,
        remark: '全部资料补充完毕，提交复核。更正说明：1.责任对象更正为联动系统；2.金额更正为25000元；3.发生时间提前75分钟',
        beforeSnapshot: {
          title: '暴雨期间集水井溢流',
          description: '暴雨橙色预警期间集水井最高水位达8.2米，超过设计警戒水位（7.5米），发生溢流约45分钟',
          source: '市民热线转办',
          keyObject: '集水井+3#水泵联动系统',
          occurrenceTime: updatedOccurrenceTime.toISOString(),
          amount: '25000',
          evidenceConclusion: '重新处理：已补充3#泵故障分析报告，待复核'
        },
        afterSnapshot: {
          title: '暴雨期间集水井溢流',
          description: '暴雨橙色预警期间集水井最高水位达8.2米，超过设计警戒水位（7.5米），发生溢流约45分钟',
          source: '市民热线转办',
          keyObject: '集水井+3#水泵联动系统',
          occurrenceTime: updatedOccurrenceTime.toISOString(),
          amount: '25000',
          evidenceConclusion: '重新处理提交复核：全部关键信息已更正'
        },
        fieldDiffs: {
          create: [
            {
              id: 'diff-reprocess-004-process2-evidence',
              fieldName: 'evidenceConclusion',
              fieldLabel: '证据结论',
              oldValue: '重新处理：已补充3#泵故障分析报告，待复核',
              newValue: '重新处理提交复核：全部关键信息已更正',
              diffType: 'conclusion'
            }
          ]
        },
        createdAt: t6,
        updatedAt: t6
      }
    ]
  )

  console.log(`Created reprocess record: ${record.recordNo}`)
  return record
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
