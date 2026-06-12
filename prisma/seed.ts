import { PrismaClient, UserRole, RecordStatus, RecordType, FieldChangeType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.attachment.deleteMany();
  await prisma.keyObject.deleteMany();
  await prisma.diffTracker.deleteMany();
  await prisma.recordNode.deleteMany();
  await prisma.equipmentRecord.deleteMany();
  await prisma.user.deleteMany();

  const fieldHandler1 = await prisma.user.create({
    data: {
      name: '张伟',
      employeeId: 'FH001',
      role: UserRole.FIELD_HANDLER,
      department: '场馆运维部',
      phone: '13800138001'
    }
  });

  const fieldHandler2 = await prisma.user.create({
    data: {
      name: '李娜',
      employeeId: 'FH002',
      role: UserRole.FIELD_HANDLER,
      department: '场馆运维部',
      phone: '13800138002'
    }
  });

  const qualityReviewer1 = await prisma.user.create({
    data: {
      name: '王强',
      employeeId: 'QR001',
      role: UserRole.QUALITY_REVIEWER,
      department: '质量控制部',
      phone: '13900139001'
    }
  });

  const qualityReviewer2 = await prisma.user.create({
    data: {
      name: '刘芳',
      employeeId: 'QR002',
      role: UserRole.QUALITY_REVIEWER,
      department: '质量控制部',
      phone: '13900139002'
    }
  });

  const admin = await prisma.user.create({
    data: {
      name: '系统管理员',
      employeeId: 'ADMIN001',
      role: UserRole.ADMIN,
      department: '信息技术部',
      phone: '13700137001'
    }
  });

  await seedNormalDelivery(fieldHandler1, qualityReviewer1);
  await seedQualificationMismatch(fieldHandler2, qualityReviewer1);
  await seedTimeWindowConflict(fieldHandler1, qualityReviewer2);
  await seedNotificationUnconfirmed(fieldHandler2, qualityReviewer2);

  console.log('Seed data created successfully!');
}

async function seedNormalDelivery(handler: any, reviewer: any) {
  const record = await prisma.equipmentRecord.create({
    data: {
      recordNo: 'REC-2026-0001',
      title: '国家体育场田径赛事器材布置验收',
      type: RecordType.NORMAL_DELIVERY,
      status: RecordStatus.ARCHIVED,
      source: '赛事组委会',
      venue: '国家体育场（鸟巢）',
      eventName: '2026年全国田径锦标赛',
      equipmentList: {
        items: [
          { name: '起跑器', quantity: 10, unit: '套', status: '完好' },
          { name: '跨栏架', quantity: 50, unit: '个', status: '完好' },
          { name: '跳高垫', quantity: 4, unit: '套', status: '完好' },
          { name: '铅球投掷圈', quantity: 2, unit: '套', status: '完好' }
        ]
      },
      scheduledTime: new Date('2026-06-10T08:00:00'),
      actualTime: new Date('2026-06-10T07:45:00'),
      amount: 125000,
      isArchived: true,
      conclusion: '器材全部到位，状态良好，符合赛事要求',
      basisAdopted: '《体育场馆器材布置规范》GB/T 34323-2017',
      creatorId: handler.id,
      currentAssigneeId: reviewer.id,
      keyObjects: {
        create: [
          { objectType: '责任单位', objectName: '布置服务商', objectValue: '北京体育设施工程有限公司', isCritical: true },
          { objectType: '赛事项目', objectName: '田径赛事', objectValue: '2026年全国田径锦标赛', isCritical: true },
          { objectType: '金额', objectName: '合同金额', objectValue: '125,000元', isCritical: true }
        ]
      }
    }
  });

  const acceptNode = await prisma.recordNode.create({
    data: {
      recordId: record.id,
      nodeType: '受理登记',
      status: RecordStatus.ACCEPTED,
      description: '赛事组委会提交器材布置验收申请',
      handlerId: handler.id,
      fieldNotes: '申请材料齐全，符合受理条件',
      conclusion: '同意受理'
    }
  });

  const processNode = await prisma.recordNode.create({
    data: {
      recordId: record.id,
      nodeType: '现场处理',
      status: RecordStatus.PROCESSING,
      description: '一线人员现场核查器材布置情况',
      handlerId: handler.id,
      fieldNotes: '所有器材均已按规范布置到位',
      onSiteNotes: '起跑器间距80cm，跨栏高度符合标准，跳高垫摆放位置正确',
      conclusion: '器材布置合格，提请复核',
      parentNodeId: acceptNode.id
    }
  });

  const reviewNode = await prisma.recordNode.create({
    data: {
      recordId: record.id,
      nodeType: '质量复核',
      status: RecordStatus.REVIEWING,
      description: '质控人员复核处理结果',
      handlerId: reviewer.id,
      fieldNotes: '核查现场照片和测量数据，确认符合规范要求',
      conclusion: '复核通过，同意归档',
      parentNodeId: processNode.id
    }
  });

  await prisma.recordNode.create({
    data: {
      recordId: record.id,
      nodeType: '归档完成',
      status: RecordStatus.ARCHIVED,
      description: '记录已完成全部流程，正式归档',
      handlerId: reviewer.id,
      conclusion: '已归档，流程闭环',
      parentNodeId: reviewNode.id,
      isArchived: true
    }
  });

  await prisma.attachment.createMany({
    data: [
      {
        recordId: record.id,
        nodeId: processNode.id,
        fileName: '起跑器布置照片.jpg',
        fileType: 'image/jpeg',
        fileUrl: '/attachments/photo1.jpg',
        description: '起跑器现场布置照片',
        uploadedById: handler.id
      },
      {
        recordId: record.id,
        nodeId: processNode.id,
        fileName: '跨栏测量数据.pdf',
        fileType: 'application/pdf',
        fileUrl: '/attachments/data1.pdf',
        description: '跨栏高度测量记录表',
        uploadedById: handler.id
      },
      {
        recordId: record.id,
        nodeId: reviewNode.id,
        fileName: '复核确认单.pdf',
        fileType: 'application/pdf',
        fileUrl: '/attachments/review1.pdf',
        description: '质量复核确认单据',
        uploadedById: reviewer.id
      }
    ]
  });
}

async function seedQualificationMismatch(handler: any, reviewer: any) {
  const record = await prisma.equipmentRecord.create({
    data: {
      recordNo: 'REC-2026-0002',
      title: '游泳馆跳水赛事器材布置验收',
      type: RecordType.QUALIFICATION_MISMATCH,
      status: RecordStatus.RETURNED_FOR_SUPPLEMENT,
      source: '赛事组委会',
      venue: '国家游泳中心（水立方）',
      eventName: '2026年全国跳水冠军赛',
      equipmentList: {
        items: [
          { name: '跳台防滑垫', quantity: 6, unit: '套', status: '破损' },
          { name: '出水扶梯', quantity: 4, unit: '个', status: '锈蚀' },
          { name: '计分显示板', quantity: 2, unit: '套', status: '完好' }
        ]
      },
      scheduledTime: new Date('2026-06-12T09:00:00'),
      actualTime: new Date('2026-06-12T09:15:00'),
      amount: 86000,
      isArchived: false,
      conclusion: '资格不符，需要更换服务商',
      blockReason: '服务商提供的防滑垫和出水扶梯不符合安全标准，且不具备跳水赛事器材安装资质',
      remediationPath: '1. 立即更换具备一级资质的器材服务商；2. 重新采购符合FINA标准的防滑垫和出水扶梯；3. 48小时内完成重新布置并申请二次验收',
      basisAdopted: '《游泳场馆开放条件与技术要求》GB 19079.1-2013',
      creatorId: handler.id,
      currentAssigneeId: handler.id,
      keyObjects: {
        create: [
          { objectType: '责任单位', objectName: '原服务商', objectValue: '上海水上设备安装有限公司', isCritical: true },
          { objectType: '资格问题', objectName: '资质等级', objectValue: '三级（不具备跳水赛事服务资格）', isCritical: true },
          { objectType: '差异字段', objectName: '防滑垫磨损率', objectValue: '15%（标准≤5%）', isCritical: true },
          { objectType: '补救路径', objectName: '更换服务商', objectValue: '北京专业跳水设施工程公司', isCritical: true }
        ]
      }
    }
  });

  const acceptNode = await prisma.recordNode.create({
    data: {
      recordId: record.id,
      nodeType: '受理登记',
      status: RecordStatus.ACCEPTED,
      description: '赛事组委会提交跳水赛事器材布置验收申请',
      handlerId: handler.id,
      fieldNotes: '申请材料齐全',
      conclusion: '同意受理'
    }
  });

  const processNode = await prisma.recordNode.create({
    data: {
      recordId: record.id,
      nodeType: '现场处理',
      status: RecordStatus.PROCESSING,
      description: '一线人员现场核查器材布置情况',
      handlerId: handler.id,
      fieldNotes: '发现严重质量问题：防滑垫磨损严重，出水扶梯有锈蚀痕迹',
      onSiteNotes: '3号跳台防滑垫磨损面积达20%，西侧出水扶梯表面锈蚀深度约0.5mm，存在严重安全隐患',
      conclusion: '发现重大安全隐患，需进一步核查服务商资质',
      parentNodeId: acceptNode.id
    }
  });

  const diff1 = await prisma.diffTracker.create({
    data: {
      recordId: record.id,
      nodeId: processNode.id,
      fieldName: '防滑垫状态',
      changeType: FieldChangeType.EVIDENCE_CONCLUSION,
      oldValue: { status: '完好', wearRate: '3%' },
      newValue: { status: '破损', wearRate: '20%' },
      diffDescription: '防滑垫实际磨损率远超合同约定标准',
      changedById: handler.id,
      affectsSummary: true
    }
  });

  const diff2 = await prisma.diffTracker.create({
    data: {
      recordId: record.id,
      nodeId: processNode.id,
      fieldName: '服务商资质',
      changeType: FieldChangeType.RESPONSIBLE_PARTY,
      oldValue: { qualification: '一级', certificateNo: 'QS2025-0088' },
      newValue: { qualification: '三级', certificateNo: 'QS2025-0088', note: '资质造假' },
      diffDescription: '服务商实际资质与投标文件不符，不具备跳水赛事服务资格',
      changedById: handler.id,
      affectsSummary: true
    }
  });

  const reviewNode = await prisma.recordNode.create({
    data: {
      recordId: record.id,
      nodeType: '质量复核',
      status: RecordStatus.REVIEWING,
      description: '质控人员复核异常情况',
      handlerId: reviewer.id,
      fieldNotes: '经核实，服务商资质造假属实，器材确实存在严重安全隐患',
      conclusion: '资格不符确认，退回一线处理人补充更换服务商材料',
      parentNodeId: processNode.id
    }
  });

  await prisma.recordNode.create({
    data: {
      recordId: record.id,
      nodeType: '退回补证',
      status: RecordStatus.RETURNED_FOR_SUPPLEMENT,
      description: '退回一线补充更换服务商的相关材料',
      handlerId: reviewer.id,
      conclusion: '等待一线提交新服务商资料',
      parentNodeId: reviewNode.id
    }
  });

  await prisma.attachment.createMany({
    data: [
      {
        recordId: record.id,
        nodeId: processNode.id,
        fileName: '防滑垫磨损照片.jpg',
        fileType: 'image/jpeg',
        fileUrl: '/attachments/qual_photo1.jpg',
        description: '3号跳台防滑垫磨损现场照片',
        uploadedById: handler.id
      },
      {
        recordId: record.id,
        nodeId: processNode.id,
        fileName: '扶梯锈蚀照片.jpg',
        fileType: 'image/jpeg',
        fileUrl: '/attachments/qual_photo2.jpg',
        description: '出水扶梯锈蚀细节照片',
        uploadedById: handler.id
      },
      {
        recordId: record.id,
        nodeId: processNode.id,
        fileName: '资质核查报告.pdf',
        fileType: 'application/pdf',
        fileUrl: '/attachments/qual_report.pdf',
        description: '服务商资质核查报告',
        uploadedById: handler.id
      }
    ]
  });
}

async function seedTimeWindowConflict(handler: any, reviewer: any) {
  const record = await prisma.equipmentRecord.create({
    data: {
      recordNo: 'REC-2026-0003',
      title: '体育馆篮球赛事器材回收',
      type: RecordType.TIME_WINDOW_CONFLICT,
      status: RecordStatus.PROCESSING,
      source: '场馆运营中心',
      venue: '五棵松体育馆',
      eventName: '2026年CBA夏季联赛',
      equipmentList: {
        items: [
          { name: '篮球架', quantity: 2, unit: '套', status: '待回收' },
          { name: '24秒计时器', quantity: 4, unit: '个', status: '待回收' },
          { name: '球员替补席', quantity: 4, unit: '套', status: '待回收' },
          { name: '场地地板保护层', quantity: 200, unit: '平方米', status: '待回收' }
        ]
      },
      scheduledTime: new Date('2026-06-15T22:00:00'),
      actualTime: new Date('2026-06-16T02:00:00'),
      amount: 45000,
      isArchived: false,
      conclusion: '时间窗口冲突，导致回收延迟4小时',
      blockReason: '原计划22:00开始回收，但当晚演唱会超时至24:00，加上场地清理时间，实际可开始回收时间为次日02:00，与次日凌晨的场地维护窗口冲突',
      remediationPath: '1. 协调演唱会主办方提前30分钟结束演出；2. 增加回收人员，由8人增至16人，采用平行作业；3. 申请临时延长回收窗口至次日06:00；4. 建立赛事与演出日程联动审核机制，避免类似冲突',
      basisAdopted: '《体育场馆多赛事活动调度规程》',
      creatorId: handler.id,
      currentAssigneeId: handler.id,
      keyObjects: {
        create: [
          { objectType: '冲突事件', objectName: '演唱会超时', objectValue: '某歌手演唱会', isCritical: true },
          { objectType: '时间差异', objectName: '延迟时长', objectValue: '4小时', isCritical: true },
          { objectType: '金额影响', objectName: '额外人工成本', objectValue: '8,000元', isCritical: true },
          { objectType: '补救措施', objectName: '增加人员', objectValue: '16人平行作业', isCritical: true }
        ]
      }
    }
  });

  const acceptNode = await prisma.recordNode.create({
    data: {
      recordId: record.id,
      nodeType: '受理登记',
      status: RecordStatus.ACCEPTED,
      description: '场馆运营中心提交篮球赛事器材回收申请',
      handlerId: handler.id,
      fieldNotes: '回收计划已制定，时间窗口为22:00-02:00',
      conclusion: '同意受理'
    }
  });

  const processNode = await prisma.recordNode.create({
    data: {
      recordId: record.id,
      nodeType: '现场处理',
      status: RecordStatus.PROCESSING,
      description: '回收现场出现时间窗口冲突',
      handlerId: handler.id,
      fieldNotes: '演唱会超时，无法按计划时间开始回收',
      onSiteNotes: '现场观众仍在退场，舞台拆除工作刚刚开始，预计还需2小时才能清场',
      conclusion: '时间窗口冲突，正在协调解决方案',
      parentNodeId: acceptNode.id
    }
  });

  const diff1 = await prisma.diffTracker.create({
    data: {
      recordId: record.id,
      nodeId: processNode.id,
      fieldName: '计划回收时间',
      changeType: FieldChangeType.CRITICAL_TIME,
      oldValue: { scheduledStart: '2026-06-15T22:00:00', scheduledEnd: '2026-06-16T02:00:00' },
      newValue: { scheduledStart: '2026-06-16T02:00:00', scheduledEnd: '2026-06-16T06:00:00' },
      diffDescription: '回收时间窗口因演唱会超时而延后4小时',
      changedById: handler.id,
      affectsSummary: true
    }
  });

  const diff2 = await prisma.diffTracker.create({
    data: {
      recordId: record.id,
      nodeId: processNode.id,
      fieldName: '回收成本',
      changeType: FieldChangeType.AMOUNT,
      oldValue: { laborCost: 32000, totalAmount: 45000 },
      newValue: { laborCost: 40000, totalAmount: 53000, note: '增加8人加班费' },
      diffDescription: '因时间窗口调整，需增加8人夜间加班，人工成本增加8000元',
      changedById: handler.id,
      affectsSummary: true
    }
  });

  await prisma.attachment.createMany({
    data: [
      {
        recordId: record.id,
        nodeId: processNode.id,
        fileName: '现场清场照片.jpg',
        fileType: 'image/jpeg',
        fileUrl: '/attachments/time_photo1.jpg',
        description: '23:30现场仍有大量观众正在退场',
        uploadedById: handler.id
      },
      {
        recordId: record.id,
        nodeId: processNode.id,
        fileName: '时间协调记录.pdf',
        fileType: 'application/pdf',
        fileUrl: '/attachments/time_coordination.pdf',
        description: '与演唱会主办方、场馆运营方的三方协调记录',
        uploadedById: handler.id
      }
    ]
  });
}

async function seedNotificationUnconfirmed(handler: any, reviewer: any) {
  const record = await prisma.equipmentRecord.create({
    data: {
      recordNo: 'REC-2026-0004',
      title: '网球中心赛事器材布置验收',
      type: RecordType.NOTIFICATION_UNCONFIRMED,
      status: RecordStatus.REVIEWING,
      source: '赛事管理系统',
      venue: '国家网球中心',
      eventName: '2026年中国网球公开赛',
      equipmentList: {
        items: [
          { name: '网球网及网柱', quantity: 16, unit: '套', status: '完好' },
          { name: '裁判椅', quantity: 16, unit: '个', status: '完好' },
          { name: '球员休息椅', quantity: 32, unit: '个', status: '完好' },
          { name: '计分牌', quantity: 16, unit: '个', status: '部分损坏' }
        ]
      },
      scheduledTime: new Date('2026-06-18T10:00:00'),
      actualTime: new Date('2026-06-18T10:00:00'),
      amount: 98000,
      isArchived: false,
      conclusion: '关键节点通知未确认，存在流程风险',
      blockReason: '器材布置完成通知、初检通知、复检通知三次关键节点通知，服务商均未在系统中确认签收，仅通过电话口头确认，不符合流程管理要求',
      remediationPath: '1. 补发所有节点的正式通知，要求服务商24小时内书面确认；2. 对未确认原因进行调查，如是系统问题则优化通知机制；3. 建立通知确认超时预警机制，超过4小时未确认自动升级；4. 对本次未按流程操作的相关人员进行培训',
      basisAdopted: '《体育赛事器材管理流程规范》第12条：关键节点必须有书面确认',
      creatorId: handler.id,
      currentAssigneeId: reviewer.id,
      keyObjects: {
        create: [
          { objectType: '通知节点', objectName: '布置完成通知', objectValue: '未确认（已发送72小时）', isCritical: true },
          { objectType: '通知节点', objectName: '初检通知', objectValue: '未确认（已发送48小时）', isCritical: true },
          { objectType: '通知节点', objectName: '复检通知', objectValue: '未确认（已发送24小时）', isCritical: true },
          { objectType: '补救措施', objectName: '补发通知', objectValue: '24小时内确认', isCritical: true }
        ]
      }
    }
  });

  const acceptNode = await prisma.recordNode.create({
    data: {
      recordId: record.id,
      nodeType: '受理登记',
      status: RecordStatus.ACCEPTED,
      description: '系统自动受理网球赛事器材布置验收申请',
      handlerId: handler.id,
      fieldNotes: '系统自动受理，已发送布置完成通知',
      conclusion: '已受理，待服务商确认'
    }
  });

  const processNode = await prisma.recordNode.create({
    data: {
      recordId: record.id,
      nodeType: '现场处理',
      status: RecordStatus.PROCESSING,
      description: '现场核查发现通知未确认问题',
      handlerId: handler.id,
      fieldNotes: '现场器材基本布置到位，但系统显示三次通知均未确认',
      onSiteNotes: '1-8号场地器材完好，9-16号场地有3个计分牌显示屏不亮；电话联系服务商负责人，对方称收到通知但太忙忘记确认',
      conclusion: '器材基本合格，但存在流程合规性问题，提请复核',
      parentNodeId: acceptNode.id
    }
  });

  const diff1 = await prisma.diffTracker.create({
    data: {
      recordId: record.id,
      nodeId: processNode.id,
      fieldName: '通知确认状态',
      changeType: FieldChangeType.EVIDENCE_CONCLUSION,
      oldValue: { status: '待确认', expectedTime: '24小时内' },
      newValue: { status: '未确认', actualDelay: '72小时', count: 3 },
      diffDescription: '三次关键节点通知均未在规定时间内确认，最长延迟达72小时',
      changedById: handler.id,
      affectsSummary: true
    }
  });

  const diff2 = await prisma.diffTracker.create({
    data: {
      recordId: record.id,
      nodeId: processNode.id,
      fieldName: '计分牌状态',
      changeType: FieldChangeType.EVIDENCE_CONCLUSION,
      oldValue: { status: '完好', quantity: 16 },
      newValue: { status: '部分损坏', good: 13, damaged: 3 },
      diffDescription: '3个计分牌显示屏不亮，需要维修或更换',
      changedById: handler.id,
      affectsSummary: true
    }
  });

  await prisma.recordNode.create({
    data: {
      recordId: record.id,
      nodeType: '质量复核',
      status: RecordStatus.REVIEWING,
      description: '质控人员复核流程合规性问题',
      handlerId: reviewer.id,
      fieldNotes: '正在核实通知未确认的具体原因，评估流程风险',
      conclusion: '复核中，待确认补发通知的回复情况',
      parentNodeId: processNode.id
    }
  });

  await prisma.attachment.createMany({
    data: [
      {
        recordId: record.id,
        nodeId: acceptNode.id,
        fileName: '布置完成通知.pdf',
        fileType: 'application/pdf',
        fileUrl: '/attachments/notif1.pdf',
        description: '布置完成通知（已发送，未确认）',
        uploadedById: handler.id
      },
      {
        recordId: record.id,
        nodeId: processNode.id,
        fileName: '计分牌损坏照片.jpg',
        fileType: 'image/jpeg',
        fileUrl: '/attachments/notif_photo1.jpg',
        description: '12号场地计分牌显示屏损坏照片',
        uploadedById: handler.id
      },
      {
        recordId: record.id,
        nodeId: processNode.id,
        fileName: '电话沟通录音文字稿.pdf',
        fileType: 'application/pdf',
        fileUrl: '/attachments/notif_call.pdf',
        description: '与服务商负责人的电话沟通记录',
        uploadedById: handler.id
      }
    ]
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
