import { Pool } from 'pg';

function cuid() {
  const timestamp = Date.now().toString(36);
  const randomPart1 = Math.random().toString(36).slice(2, 10);
  const randomPart2 = Math.random().toString(36).slice(2, 10);
  return `c${timestamp}${randomPart1}${randomPart2}`;
}

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'venue_equipment'
});

const UserRole = {
  ADMIN: 'ADMIN',
  FIELD_HANDLER: 'FIELD_HANDLER',
  QUALITY_REVIEWER: 'QUALITY_REVIEWER'
};

const RecordStatus = {
  ACCEPTED: 'ACCEPTED',
  PROCESSING: 'PROCESSING',
  REVIEWING: 'REVIEWING',
  CONFIRMED: 'CONFIRMED',
  RETURNED_FOR_SUPPLEMENT: 'RETURNED_FOR_SUPPLEMENT',
  ARCHIVED: 'ARCHIVED',
  REOPENED: 'REOPENED'
};

const RecordType = {
  NORMAL_DELIVERY: 'NORMAL_DELIVERY',
  QUALIFICATION_MISMATCH: 'QUALIFICATION_MISMATCH',
  TIME_WINDOW_CONFLICT: 'TIME_WINDOW_CONFLICT',
  NOTIFICATION_UNCONFIRMED: 'NOTIFICATION_UNCONFIRMED'
};

const FieldChangeType = {
  CRITICAL_TIME: 'CRITICAL_TIME',
  RESPONSIBLE_PARTY: 'RESPONSIBLE_PARTY',
  AMOUNT: 'AMOUNT',
  EVIDENCE_CONCLUSION: 'EVIDENCE_CONCLUSION',
  EQUIPMENT_SPEC: 'EQUIPMENT_SPEC',
  VENUE_ARRANGEMENT: 'VENUE_ARRANGEMENT'
};

async function main() {
  const client = await pool.connect();
  try {
    console.log('开始清除现有数据...');
    await client.query('TRUNCATE TABLE "Attachment", "KeyObject", "DiffTracker", "RecordNode", "EquipmentRecord", "User" RESTART IDENTITY CASCADE');

    console.log('创建用户...');
    const users = {};
    const userResults = [];
  userResults.push(await client.query(
    'INSERT INTO "User" (id, name, "employeeId", role, department, phone, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [cuid(), '张伟', 'FH001', UserRole.FIELD_HANDLER, '场馆运维部', '13800138001', new Date(), new Date()]
  ));
  userResults.push(await client.query(
    'INSERT INTO "User" (id, name, "employeeId", role, department, phone, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [cuid(), '李娜', 'FH002', UserRole.FIELD_HANDLER, '场馆运维部', '13800138002', new Date(), new Date()]
  ));
  userResults.push(await client.query(
    'INSERT INTO "User" (id, name, "employeeId", role, department, phone, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [cuid(), '王强', 'QR001', UserRole.QUALITY_REVIEWER, '质量控制部', '13900139001', new Date(), new Date()]
  ));
  userResults.push(await client.query(
    'INSERT INTO "User" (id, name, "employeeId", role, department, phone, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [cuid(), '刘芳', 'QR002', UserRole.QUALITY_REVIEWER, '质量控制部', '13900139002', new Date(), new Date()]
  ));
  userResults.push(await client.query(
    'INSERT INTO "User" (id, name, "employeeId", role, department, phone, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [cuid(), '陈明', 'AD001', UserRole.ADMIN, '行政管理部', '13700137001', new Date(), new Date()]
  ));
    users.fieldHandler1 = userResults[0].rows[0];
    users.fieldHandler2 = userResults[1].rows[0];
    users.qualityReviewer1 = userResults[2].rows[0];
    users.qualityReviewer2 = userResults[3].rows[0];
    users.admin = userResults[4].rows[0];

    console.log('创建样本记录 1: 正常交付...');
    await createRecord1(client, users);
    console.log('创建样本记录 2: 资格不符...');
    await createRecord2(client, users);
    console.log('创建样本记录 3: 时间窗口冲突...');
    await createRecord3(client, users);
    console.log('创建样本记录 4: 通知未确认...');
    await createRecord4(client, users);

    console.log('');
    console.log('样本数据创建完成！');

    const counts = await Promise.all([
      client.query('SELECT COUNT(*) FROM "User"'),
      client.query('SELECT COUNT(*) FROM "EquipmentRecord"'),
      client.query('SELECT COUNT(*) FROM "RecordNode"'),
      client.query('SELECT COUNT(*) FROM "DiffTracker"'),
      client.query('SELECT COUNT(*) FROM "Attachment"'),
      client.query('SELECT COUNT(*) FROM "KeyObject"')
    ]);
    console.log(`- 用户: ${counts[0].rows[0].count}条`);
    console.log(`- 记录: ${counts[1].rows[0].count}条`);
    console.log(`- 节点: ${counts[2].rows[0].count}条`);
    console.log(`- 变更追踪: ${counts[3].rows[0].count}条`);
    console.log(`- 附件: ${counts[4].rows[0].count}条`);
    console.log(`- 关键对象: ${counts[5].rows[0].count}条`);
  } finally {
    client.release();
    await pool.end();
  }
}

async function createRecord1(client, users) {
  const now = new Date();
  const recordRes = await client.query(
    `INSERT INTO "EquipmentRecord" (
      id, "recordNo", title, type, status, source, venue, "eventName",
      "equipmentList", "scheduledTime", "actualTime", amount,
      "isArchived", conclusion, "basisAdopted", "creatorId",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
    [
      cuid(),
      'REC-2026-0001',
      '国家体育场田径赛事器材布置验收',
      RecordType.NORMAL_DELIVERY,
      RecordStatus.ARCHIVED,
      '赛事组委会工单',
      '国家体育场（鸟巢）',
      '2026年全国田径锦标赛',
      JSON.stringify({ items: [
        { name: '跨栏架', quantity: 50, unit: '个' },
        { name: '起跑器', quantity: 20, unit: '个' },
        { name: '跳高垫', quantity: 5, unit: '张' }
      ]}),
      new Date('2026-03-15T08:00:00Z'),
      new Date('2026-03-15T07:30:00Z'),
      150000,
      true,
      '所有器材按要求布置完成，验收合格',
      '《体育场馆器材布置规范》TY/T 1001-2023',
      users.admin.id,
      now,
      now
    ]
  );
  const recordId = recordRes.rows[0].id;

  await createNodes(client, recordId, [
    { nodeType: '受理登记', status: RecordStatus.ACCEPTED, description: '赛事组委会提交器材布置申请', handlerId: users.admin.id },
    { nodeType: '现场处理', status: RecordStatus.PROCESSING, description: '现场器材布置完成，检查无误', fieldNotes: '跨栏架间距准确，跳高垫位置正确', onSiteNotes: '现场拍照取证，所有器材完好', conclusion: '布置完成，申请验收', handlerId: users.fieldHandler1.id },
    { nodeType: '质量复核-确认', status: RecordStatus.REVIEWING, description: '复核通过，所有指标符合要求', conclusion: '复核合格', handlerId: users.qualityReviewer1.id },
    { nodeType: '归档完成', status: RecordStatus.ARCHIVED, description: '记录归档保存', conclusion: '已归档', handlerId: users.qualityReviewer1.id, isArchived: true }
  ]);

  await createKeyObjects(client, recordId, [
    { objectType: '场馆', objectName: '国家体育场', objectValue: '10000人座', isCritical: true },
    { objectType: '赛事', objectName: '全国田径锦标赛', objectValue: '甲级赛事', isCritical: true },
    { objectType: '供应商', objectName: '奥健体育器材', objectValue: '甲级资质', isCritical: false }
  ]);

  const record = await client.query('SELECT id FROM "RecordNode" WHERE "recordId" = $1 ORDER BY "createdAt"', [recordId]);
  const nodeIds = record.rows.map(r => r.id);

  await createAttachments(client, recordId, [
    { fileName: '现场布置照片.jpg', fileType: 'image/jpeg', fileUrl: '/attachments/rec001-photo1.jpg', description: '跨栏架布置全景照', uploadedById: users.fieldHandler1.id, nodeId: nodeIds[1] },
    { fileName: '验收确认单.pdf', fileType: 'application/pdf', fileUrl: '/attachments/rec001-doc1.pdf', description: '双方签字确认的验收单', uploadedById: users.qualityReviewer1.id, nodeId: nodeIds[2] }
  ]);
}

async function createRecord2(client, users) {
  const now = new Date();
  const recordRes = await client.query(
    `INSERT INTO "EquipmentRecord" (
      id, "recordNo", title, type, status, source, venue, "eventName",
      "equipmentList", "scheduledTime", amount, conclusion,
      "blockReason", "remediationPath", "basisAdopted",
      "creatorId", "currentAssigneeId", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
    [
      cuid(),
      'REC-2026-0002',
      '游泳馆跳水赛事器材供应商资格不符',
      RecordType.QUALIFICATION_MISMATCH,
      RecordStatus.RETURNED_FOR_SUPPLEMENT,
      '资格预审系统',
      '国家游泳中心（水立方）',
      '2026年国际跳水邀请赛',
      JSON.stringify({ items: [
        { name: '跳水池保护垫', quantity: 10, unit: '张' },
        { name: '裁判椅', quantity: 7, unit: '个' }
      ]}),
      new Date('2026-04-20T09:00:00Z'),
      280000,
      '供应商资质过期，需重新提交',
      '供应商提供的《体育器材生产许可证》已过期3个月，不符合《赛事器材采购管理规定》第12条要求',
      '1. 立即联系供应商更新资质文件；2. 资质审核通过前暂停所有合作；3. 备用供应商已准备就绪，必要时启动应急预案',
      '《体育器材采购供应商资质审核规范》QJ/ST-003-2025',
      users.admin.id,
      users.fieldHandler2.id,
      now,
      now
    ]
  );
  const recordId = recordRes.rows[0].id;

  const nodes = await createNodes(client, recordId, [
    { nodeType: '受理登记', status: RecordStatus.ACCEPTED, description: '供应商资格预审申请', handlerId: users.admin.id },
    { nodeType: '现场处理', status: RecordStatus.PROCESSING, description: '发现资质文件过期', fieldNotes: '供应商资质证书有效期至2025年12月31日，当前已过期', onSiteNotes: '已与供应商电话沟通，对方称正在办理续期', conclusion: '发现资质问题，需进一步处理', handlerId: users.fieldHandler2.id },
    { nodeType: '质量复核-退回补证', status: RecordStatus.RETURNED_FOR_SUPPLEMENT, description: '退回处理人，要求补充资质证明', fieldNotes: '请供应商在3个工作日内提交更新后的资质证书', conclusion: '退回补证', handlerId: users.qualityReviewer2.id }
  ]);

  await createDiffs(client, recordId, [
    { fieldName: '供应商资质', changeType: FieldChangeType.EVIDENCE_CONCLUSION, oldValue: JSON.stringify({ status: '有效', expiryDate: '2025-12-31' }), newValue: JSON.stringify({ status: '过期', expiryDate: '2025-12-31' }), diffDescription: '供应商资质已过期，需重新审核', changedById: users.fieldHandler2.id, affectsSummary: true, nodeId: nodes[1].id }
  ]);

  await createKeyObjects(client, recordId, [
    { objectType: '场馆', objectName: '国家游泳中心', objectValue: '甲级场馆', isCritical: true },
    { objectType: '供应商', objectName: '华宇体育用品', objectValue: '资质待更新', isCritical: true },
    { objectType: '赛事', objectName: '国际跳水邀请赛', objectValue: '国际赛事', isCritical: true }
  ]);

  await createAttachments(client, recordId, [
    { fileName: '过期资质证书扫描件.pdf', fileType: 'application/pdf', fileUrl: '/attachments/rec002-cert-expired.pdf', description: '供应商提供的过期资质证书', uploadedById: users.fieldHandler2.id, nodeId: nodes[1].id }
  ]);
}

async function createRecord3(client, users) {
  const now = new Date();
  const recordRes = await client.query(
    `INSERT INTO "EquipmentRecord" (
      id, "recordNo", title, type, status, source, venue, "eventName",
      "equipmentList", "scheduledTime", amount, conclusion,
      "blockReason", "remediationPath", "basisAdopted",
      "creatorId", "currentAssigneeId", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
    [
      cuid(),
      'REC-2026-0003',
      '五棵松篮球馆赛后回收时间窗口冲突',
      RecordType.TIME_WINDOW_CONFLICT,
      RecordStatus.PROCESSING,
      '场馆调度系统',
      '五棵松体育中心',
      'CBA季后赛第四场',
      JSON.stringify({ items: [
        { name: '篮球架', quantity: 2, unit: '个' },
        { name: '观众席座椅', quantity: 500, unit: '个' },
        { name: '电子记分牌', quantity: 1, unit: '套' }
      ]}),
      new Date('2026-05-10T22:00:00Z'),
      450000,
      '回收时间与次日场馆活动冲突，正在协调',
      '原计划赛后22:00开始回收，但次日08:00有另一活动进场，6小时窗口不足以完成全部器材回收和场地清理',
      '1. 协调赛事组委会延长回收时间至次日02:00；2. 增加回收人员至20人，分两组并行作业；3. 优先回收大型器材，小型器材延后处理',
      '《体育场馆多赛事并行调度管理办法》TY/T 2001-2024',
      users.admin.id,
      users.fieldHandler1.id,
      now,
      now
    ]
  );
  const recordId = recordRes.rows[0].id;

  const nodes = await createNodes(client, recordId, [
    { nodeType: '受理登记', status: RecordStatus.ACCEPTED, description: '赛后器材回收任务登记', handlerId: users.admin.id },
    { nodeType: '现场处理', status: RecordStatus.PROCESSING, description: '发现时间窗口冲突，正在协调解决方案', fieldNotes: '与场馆管理方和赛事组委会召开紧急协调会议', onSiteNotes: '现场评估回收工作量，预计需要8小时完成全部回收', conclusion: '时间窗口冲突，处理中', handlerId: users.fieldHandler1.id }
  ]);

  await createDiffs(client, recordId, [
    { fieldName: '计划回收时间', changeType: FieldChangeType.CRITICAL_TIME, oldValue: JSON.stringify({ start: '2026-05-10T22:00:00Z', end: '2026-05-11T04:00:00Z' }), newValue: JSON.stringify({ start: '2026-05-10T22:00:00Z', end: '2026-05-11T06:00:00Z' }), diffDescription: '回收时间窗口从6小时延长至8小时', changedById: users.fieldHandler1.id, affectsSummary: true, nodeId: nodes[1].id },
    { fieldName: '回收作业人员', changeType: FieldChangeType.RESPONSIBLE_PARTY, oldValue: JSON.stringify({ team: 'A组', count: 10 }), newValue: JSON.stringify({ team: 'A组+B组', count: 20 }), diffDescription: '增加回收人员以缩短作业时间', changedById: users.fieldHandler1.id, affectsSummary: true, nodeId: nodes[1].id }
  ]);

  await createKeyObjects(client, recordId, [
    { objectType: '场馆', objectName: '五棵松体育中心', objectValue: '18000人座', isCritical: true },
    { objectType: '赛事', objectName: 'CBA季后赛', objectValue: '顶级赛事', isCritical: true },
    { objectType: '回收团队', objectName: '场馆运维A组', objectValue: '10人', isCritical: false }
  ]);

  await createAttachments(client, recordId, [
    { fileName: '场馆日程冲突截图.png', fileType: 'image/png', fileUrl: '/attachments/rec003-schedule-conflict.png', description: '场馆日程系统显示的时间冲突', uploadedById: users.fieldHandler1.id, nodeId: nodes[1].id },
    { fileName: '协调会议纪要.docx', fileType: 'application/docx', fileUrl: '/attachments/rec003-meeting-notes.docx', description: '三方协调会议纪要', uploadedById: users.fieldHandler1.id, nodeId: nodes[1].id }
  ]);
}

async function createRecord4(client, users) {
  const now = new Date();
  const recordRes = await client.query(
    `INSERT INTO "EquipmentRecord" (
      id, "recordNo", title, type, status, source, venue, "eventName",
      "equipmentList", "scheduledTime", amount, conclusion,
      "blockReason", "remediationPath", "basisAdopted",
      "creatorId", "currentAssigneeId", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
    [
      cuid(),
      'REC-2026-0004',
      '网球中心赛事器材进场通知未确认',
      RecordType.NOTIFICATION_UNCONFIRMED,
      RecordStatus.REVIEWING,
      '通知管理系统',
      '国家网球中心',
      '2026年中国网球公开赛',
      JSON.stringify({ items: [
        { name: '网球网柱', quantity: 20, unit: '个' },
        { name: '裁判椅', quantity: 20, unit: '个' },
        { name: '球童休息椅', quantity: 40, unit: '个' }
      ]}),
      new Date('2026-06-01T08:00:00Z'),
      320000,
      '已三次发送进场通知，对方均未确认',
      '器材供应商已收到3次进场时间确认通知，但未在规定的24小时内予以确认，可能导致进场延误',
      '1. 已通过电话直接联系供应商负责人；2. 发送正式书面通知并留存送达证据；3. 如48小时内仍无回应，将启动备用供应商',
      '《赛事器材供应合同》第8.2条关于通知确认的约定',
      users.admin.id,
      users.qualityReviewer1.id,
      now,
      now
    ]
  );
  const recordId = recordRes.rows[0].id;

  const nodes = await createNodes(client, recordId, [
    { nodeType: '受理登记', status: RecordStatus.ACCEPTED, description: '器材进场计划登记', handlerId: users.admin.id },
    { nodeType: '现场处理', status: RecordStatus.PROCESSING, description: '发送三次通知，对方未确认', fieldNotes: '5月28日、29日、30日三次发送短信+邮件通知', onSiteNotes: '5月30日下午电话联系，对方称正在内部协调', conclusion: '通知未确认，已上报复核', handlerId: users.fieldHandler2.id },
    { nodeType: '质量复核-确认', status: RecordStatus.REVIEWING, description: '复核处理方案，确认补救措施', conclusion: '正在复核中', handlerId: users.qualityReviewer1.id }
  ]);

  await createDiffs(client, recordId, [
    { fieldName: '合同金额', changeType: FieldChangeType.AMOUNT, oldValue: '300000', newValue: '320000', diffDescription: '因增加备用供应商预案，预算增加2万元', changedById: users.fieldHandler2.id, affectsSummary: true, nodeId: nodes[1].id }
  ]);

  await createKeyObjects(client, recordId, [
    { objectType: '场馆', objectName: '国家网球中心', objectValue: '主赛场+训练场', isCritical: true },
    { objectType: '供应商', objectName: '网球世家器材', objectValue: '未确认通知', isCritical: true },
    { objectType: '备用供应商', objectName: '金满贯体育', objectValue: '待命状态', isCritical: false }
  ]);

  await createAttachments(client, recordId, [
    { fileName: '通知发送记录截图.png', fileType: 'image/png', fileUrl: '/attachments/rec004-notification-log.png', description: '三次通知的发送记录', uploadedById: users.fieldHandler2.id, nodeId: nodes[1].id },
    { fileName: '电话通话录音.mp3', fileType: 'audio/mpeg', fileUrl: '/attachments/rec004-call-recording.mp3', description: '与供应商的电话沟通录音', uploadedById: users.fieldHandler2.id, nodeId: nodes[1].id },
    { fileName: '备用供应商协议.pdf', fileType: 'application/pdf', fileUrl: '/attachments/rec004-backup-agreement.pdf', description: '与备用供应商的框架协议', uploadedById: users.qualityReviewer1.id, nodeId: nodes[2].id }
  ]);
}

async function createNodes(client, recordId, nodesData) {
  const created = [];
  let parentNodeId = null;
  for (const node of nodesData) {
    const res = await client.query(
      `INSERT INTO "RecordNode" (
        id, "recordId", "nodeType", status, description,
        "fieldNotes", "onSiteNotes", conclusion, "handlerId", "parentNodeId", "isArchived"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        cuid(),
        recordId,
        node.nodeType,
        node.status,
        node.description || null,
        node.fieldNotes || null,
        node.onSiteNotes || null,
        node.conclusion || null,
        node.handlerId,
        parentNodeId,
        node.isArchived || false
      ]
    );
    created.push(res.rows[0]);
    parentNodeId = res.rows[0].id;
  }
  return created;
}

async function createDiffs(client, recordId, diffs) {
  for (const diff of diffs) {
    await client.query(
      `INSERT INTO "DiffTracker" (
        id, "recordId", "nodeId", "fieldName", "changeType",
        "oldValue", "newValue", "diffDescription", "changedById", "affectsSummary"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        cuid(),
        recordId,
        diff.nodeId,
        diff.fieldName,
        diff.changeType,
        diff.oldValue,
        diff.newValue,
        diff.diffDescription,
        diff.changedById,
        diff.affectsSummary || false
      ]
    );
  }
}

async function createKeyObjects(client, recordId, objects) {
  for (const obj of objects) {
    await client.query(
      `INSERT INTO "KeyObject" (
        id, "recordId", "objectType", "objectName", "objectValue", "isCritical"
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [cuid(), recordId, obj.objectType, obj.objectName, obj.objectValue, obj.isCritical || false]
    );
  }
}

async function createAttachments(client, recordId, attachments) {
  for (const att of attachments) {
    await client.query(
      `INSERT INTO "Attachment" (
        id, "recordId", "nodeId", "fileName", "fileType",
        "fileUrl", description, "uploadedById"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        cuid(),
        recordId,
        att.nodeId,
        att.fileName,
        att.fileType,
        att.fileUrl,
        att.description || null,
        att.uploadedById
      ]
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
