import { PrismaClient, UserRole, RecordStatus, RecordType, FieldChangeType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始清除现有数据...');
  await prisma.attachment.deleteMany();
  await prisma.keyObject.deleteMany();
  await prisma.diffTracker.deleteMany();
  await prisma.recordNode.deleteMany();
  await prisma.equipmentRecord.deleteMany();
  await prisma.user.deleteMany();

  console.log('创建用户...');
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
      name: '陈明',
      employeeId: 'AD001',
      role: UserRole.ADMIN,
      department: '行政管理部',
      phone: '13700137001'
    }
  });

  console.log('创建样本记录 1: 正常交付...');
  const record1 = await prisma.equipmentRecord.create({
    data: {
      recordNo: 'REC-2026-0001',
      title: '国家体育场田径赛事器材布置验收',
      type: RecordType.NORMAL_DELIVERY,
      status: RecordStatus.ARCHIVED,
      source: '赛事组委会工单',
      venue: '国家体育场（鸟巢）',
      eventName: '2026年全国田径锦标赛',
      equipmentList: {
        items: [
          { name: '跨栏架', quantity: 50, unit: '个' },
          { name: '起跑器', quantity: 20, unit: '个' },
          { name: '跳高垫', quantity: 5, unit: '张' }
        ]
      },
      scheduledTime: new Date('2026-03-15T08:00:00Z'),
      actualTime: new Date('2026-03-15T07:30:00Z'),
      amount: 150000,
      isArchived: true,
      conclusion: '所有器材按要求布置完成，验收合格',
      basisAdopted: '《体育场馆器材布置规范》TY/T 1001-2023',
      creatorId: admin.id,
      currentAssigneeId: null,
      nodes: {
        create: [
          {
            nodeType: '受理登记',
            status: RecordStatus.ACCEPTED,
            description: '赛事组委会提交器材布置申请',
            handlerId: admin.id
          },
          {
            nodeType: '现场处理',
            status: RecordStatus.PROCESSING,
            description: '现场器材布置完成，检查无误',
            fieldNotes: '跨栏架间距准确，跳高垫位置正确',
            onSiteNotes: '现场拍照取证，所有器材完好',
            conclusion: '布置完成，申请验收',
            handlerId: fieldHandler1.id
          },
          {
            nodeType: '质量复核-确认',
            status: RecordStatus.REVIEWING,
            description: '复核通过，所有指标符合要求',
            conclusion: '复核合格',
            handlerId: qualityReviewer1.id
          },
          {
            nodeType: '归档完成',
            status: RecordStatus.ARCHIVED,
            description: '记录归档保存',
            conclusion: '已归档',
            handlerId: qualityReviewer1.id,
            isArchived: true
          }
        ]
      },
      keyObjects: {
        create: [
          { objectType: '场馆', objectName: '国家体育场', objectValue: '10000人座', isCritical: true },
          { objectType: '赛事', objectName: '全国田径锦标赛', objectValue: '甲级赛事', isCritical: true },
          { objectType: '供应商', objectName: '奥健体育器材', objectValue: '甲级资质', isCritical: false }
        ]
      },
      attachments: {
        create: [
          {
            fileName: '现场布置照片.jpg',
            fileType: 'image/jpeg',
            fileUrl: '/attachments/rec001-photo1.jpg',
            description: '跨栏架布置全景照',
            uploadedById: fieldHandler1.id
          },
          {
            fileName: '验收确认单.pdf',
            fileType: 'application/pdf',
            fileUrl: '/attachments/rec001-doc1.pdf',
            description: '双方签字确认的验收单',
            uploadedById: qualityReviewer1.id
          }
        ]
      }
    }
  });

  console.log('创建样本记录 2: 资格不符...');
  const record2 = await prisma.equipmentRecord.create({
    data: {
      recordNo: 'REC-2026-0002',
      title: '游泳馆跳水赛事器材供应商资格不符',
      type: RecordType.QUALIFICATION_MISMATCH,
      status: RecordStatus.RETURNED_FOR_SUPPLEMENT,
      source: '资格预审系统',
      venue: '国家游泳中心（水立方）',
      eventName: '2026年国际跳水邀请赛',
      equipmentList: {
        items: [
          { name: '跳水池保护垫', quantity: 10, unit: '张' },
          { name: '裁判椅', quantity: 7, unit: '个' }
        ]
      },
      scheduledTime: new Date('2026-04-20T09:00:00Z'),
      amount: 280000,
      conclusion: '供应商资质过期，需重新提交',
      blockReason: '供应商提供的《体育器材生产许可证》已过期3个月，不符合《赛事器材采购管理规定》第12条要求',
      remediationPath: '1. 立即联系供应商更新资质文件；2. 资质审核通过前暂停所有合作；3. 备用供应商已准备就绪，必要时启动应急预案',
      basisAdopted: '《体育器材采购供应商资质审核规范》QJ/ST-003-2025',
      creatorId: admin.id,
      currentAssigneeId: fieldHandler2.id,
      nodes: {
        create: [
          {
            nodeType: '受理登记',
            status: RecordStatus.ACCEPTED,
            description: '供应商资格预审申请',
            handlerId: admin.id
          },
          {
            nodeType: '现场处理',
            status: RecordStatus.PROCESSING,
            description: '发现资质文件过期',
            fieldNotes: '供应商资质证书有效期至2025年12月31日，当前已过期',
            onSiteNotes: '已与供应商电话沟通，对方称正在办理续期',
            conclusion: '发现资质问题，需进一步处理',
            handlerId: fieldHandler2.id
          },
          {
            nodeType: '质量复核-退回补证',
            status: RecordStatus.RETURNED_FOR_SUPPLEMENT,
            description: '退回处理人，要求补充资质证明',
            fieldNotes: '请供应商在3个工作日内提交更新后的资质证书',
            conclusion: '退回补证',
            handlerId: qualityReviewer2.id
          }
        ]
      },
      diffTrackers: {
        create: [
          {
            fieldName: '供应商资质',
            changeType: FieldChangeType.EVIDENCE_CONCLUSION,
            oldValue: { status: '有效', expiryDate: '2025-12-31' },
            newValue: { status: '过期', expiryDate: '2025-12-31' },
            diffDescription: '供应商资质已过期，需重新审核',
            changedById: fieldHandler2.id,
            affectsSummary: true
          }
        ]
      },
      keyObjects: {
        create: [
          { objectType: '场馆', objectName: '国家游泳中心', objectValue: '甲级场馆', isCritical: true },
          { objectType: '供应商', objectName: '华宇体育用品', objectValue: '资质待更新', isCritical: true },
          { objectType: '赛事', objectName: '国际跳水邀请赛', objectValue: '国际赛事', isCritical: true }
        ]
      },
      attachments: {
        create: [
          {
            fileName: '过期资质证书扫描件.pdf',
            fileType: 'application/pdf',
            fileUrl: '/attachments/rec002-cert-expired.pdf',
            description: '供应商提供的过期资质证书',
            uploadedById: fieldHandler2.id
          }
        ]
      }
    }
  });

  console.log('创建样本记录 3: 时间窗口冲突...');
  const record3 = await prisma.equipmentRecord.create({
    data: {
      recordNo: 'REC-2026-0003',
      title: '五棵松篮球馆赛后回收时间窗口冲突',
      type: RecordType.TIME_WINDOW_CONFLICT,
      status: RecordStatus.PROCESSING,
      source: '场馆调度系统',
      venue: '五棵松体育中心',
      eventName: 'CBA季后赛第四场',
      equipmentList: {
        items: [
          { name: '篮球架', quantity: 2, unit: '个' },
          { name: '观众席座椅', quantity: 500, unit: '个' },
          { name: '电子记分牌', quantity: 1, unit: '套' }
        ]
      },
      scheduledTime: new Date('2026-05-10T22:00:00Z'),
      amount: 450000,
      conclusion: '回收时间与次日场馆活动冲突，正在协调',
      blockReason: '原计划赛后22:00开始回收，但次日08:00有另一活动进场，6小时窗口不足以完成全部器材回收和场地清理',
      remediationPath: '1. 协调赛事组委会延长回收时间至次日02:00；2. 增加回收人员至20人，分两组并行作业；3. 优先回收大型器材，小型器材延后处理',
      basisAdopted: '《体育场馆多赛事并行调度管理办法》TY/T 2001-2024',
      creatorId: admin.id,
      currentAssigneeId: fieldHandler1.id,
      nodes: {
        create: [
          {
            nodeType: '受理登记',
            status: RecordStatus.ACCEPTED,
            description: '赛后器材回收任务登记',
            handlerId: admin.id
          },
          {
            nodeType: '现场处理',
            status: RecordStatus.PROCESSING,
            description: '发现时间窗口冲突，正在协调解决方案',
            fieldNotes: '与场馆管理方和赛事组委会召开紧急协调会议',
            onSiteNotes: '现场评估回收工作量，预计需要8小时完成全部回收',
            conclusion: '时间窗口冲突，处理中',
            handlerId: fieldHandler1.id
          }
        ]
      },
      diffTrackers: {
        create: [
          {
            fieldName: '计划回收时间',
            changeType: FieldChangeType.CRITICAL_TIME,
            oldValue: { start: '2026-05-10T22:00:00Z', end: '2026-05-11T04:00:00Z' },
            newValue: { start: '2026-05-10T22:00:00Z', end: '2026-05-11T06:00:00Z' },
            diffDescription: '回收时间窗口从6小时延长至8小时',
            changedById: fieldHandler1.id,
            affectsSummary: true
          },
          {
            fieldName: '回收作业人员',
            changeType: FieldChangeType.RESPONSIBLE_PARTY,
            oldValue: { team: 'A组', count: 10 },
            newValue: { team: 'A组+B组', count: 20 },
            diffDescription: '增加回收人员以缩短作业时间',
            changedById: fieldHandler1.id,
            affectsSummary: true
          }
        ]
      },
      keyObjects: {
        create: [
          { objectType: '场馆', objectName: '五棵松体育中心', objectValue: '18000人座', isCritical: true },
          { objectType: '赛事', objectName: 'CBA季后赛', objectValue: '顶级赛事', isCritical: true },
          { objectType: '回收团队', objectName: '场馆运维A组', objectValue: '10人', isCritical: false }
        ]
      },
      attachments: {
        create: [
          {
            fileName: '场馆日程冲突截图.png',
            fileType: 'image/png',
            fileUrl: '/attachments/rec003-schedule-conflict.png',
            description: '场馆日程系统显示的时间冲突',
            uploadedById: fieldHandler1.id
          },
          {
            fileName: '协调会议纪要.docx',
            fileType: 'application/docx',
            fileUrl: '/attachments/rec003-meeting-notes.docx',
            description: '三方协调会议纪要',
            uploadedById: fieldHandler1.id
          }
        ]
      }
    }
  });

  console.log('创建样本记录 4: 通知未确认...');
  const record4 = await prisma.equipmentRecord.create({
    data: {
      recordNo: 'REC-2026-0004',
      title: '网球中心赛事器材进场通知未确认',
      type: RecordType.NOTIFICATION_UNCONFIRMED,
      status: RecordStatus.REVIEWING,
      source: '通知管理系统',
      venue: '国家网球中心',
      eventName: '2026年中国网球公开赛',
      equipmentList: {
        items: [
          { name: '网球网柱', quantity: 20, unit: '个' },
          { name: '裁判椅', quantity: 20, unit: '个' },
          { name: '球童休息椅', quantity: 40, unit: '个' }
        ]
      },
      scheduledTime: new Date('2026-06-01T08:00:00Z'),
      amount: 320000,
      conclusion: '已三次发送进场通知，对方均未确认',
      blockReason: '器材供应商已收到3次进场时间确认通知，但未在规定的24小时内予以确认，可能导致进场延误',
      remediationPath: '1. 已通过电话直接联系供应商负责人；2. 发送正式书面通知并留存送达证据；3. 如48小时内仍无回应，将启动备用供应商',
      basisAdopted: '《赛事器材供应合同》第8.2条关于通知确认的约定',
      creatorId: admin.id,
      currentAssigneeId: qualityReviewer1.id,
      nodes: {
        create: [
          {
            nodeType: '受理登记',
            status: RecordStatus.ACCEPTED,
            description: '器材进场计划登记',
            handlerId: admin.id
          },
          {
            nodeType: '现场处理',
            status: RecordStatus.PROCESSING,
            description: '发送三次通知，对方未确认',
            fieldNotes: '5月28日、29日、30日三次发送短信+邮件通知',
            onSiteNotes: '5月30日下午电话联系，对方称正在内部协调',
            conclusion: '通知未确认，已上报复核',
            handlerId: fieldHandler2.id
          },
          {
            nodeType: '质量复核-确认',
            status: RecordStatus.REVIEWING,
            description: '复核处理方案，确认补救措施',
            conclusion: '正在复核中',
            handlerId: qualityReviewer1.id
          }
        ]
      },
      diffTrackers: {
        create: [
          {
            fieldName: '合同金额',
            changeType: FieldChangeType.AMOUNT,
            oldValue: 300000,
            newValue: 320000,
            diffDescription: '因增加备用供应商预案，预算增加2万元',
            changedById: fieldHandler2.id,
            affectsSummary: true
          }
        ]
      },
      keyObjects: {
        create: [
          { objectType: '场馆', objectName: '国家网球中心', objectValue: '主赛场+训练场', isCritical: true },
          { objectType: '供应商', objectName: '网球世家器材', objectValue: '未确认通知', isCritical: true },
          { objectType: '备用供应商', objectName: '金满贯体育', objectValue: '待命状态', isCritical: false }
        ]
      },
      attachments: {
        create: [
          {
            fileName: '通知发送记录截图.png',
            fileType: 'image/png',
            fileUrl: '/attachments/rec004-notification-log.png',
            description: '三次通知的发送记录',
            uploadedById: fieldHandler2.id
          },
          {
            fileName: '电话通话录音.mp3',
            fileType: 'audio/mpeg',
            fileUrl: '/attachments/rec004-call-recording.mp3',
            description: '与供应商的电话沟通录音',
            uploadedById: fieldHandler2.id
          },
          {
            fileName: '备用供应商协议.pdf',
            fileType: 'application/pdf',
            fileUrl: '/attachments/rec004-backup-agreement.pdf',
            description: '与备用供应商的框架协议',
            uploadedById: qualityReviewer1.id
          }
        ]
      }
    }
  });

  console.log('样本数据创建完成！');
  console.log(`- 用户: 5条`);
  console.log(`- 记录: 4条`);
  console.log(`- 节点: ${await prisma.recordNode.count()}条`);
  console.log(`- 变更追踪: ${await prisma.diffTracker.count()}条`);
  console.log(`- 附件: ${await prisma.attachment.count()}条`);
  console.log(`- 关键对象: ${await prisma.keyObject.count()}条`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
