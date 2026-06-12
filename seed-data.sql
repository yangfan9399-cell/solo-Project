TRUNCATE TABLE "Attachment", "KeyObject", "DiffTracker", "RecordNode", "EquipmentRecord", "User" RESTART IDENTITY CASCADE;

INSERT INTO "User" ("id", "name", "employeeId", "role", "department", "phone", "createdAt", "updatedAt") VALUES
('user-fh1', '张伟', 'FH001', 'FIELD_HANDLER', '场馆运维部', '13800138001', NOW(), NOW()),
('user-fh2', '李娜', 'FH002', 'FIELD_HANDLER', '场馆运维部', '13800138002', NOW(), NOW()),
('user-qr1', '王强', 'QR001', 'QUALITY_REVIEWER', '质量控制部', '13900139001', NOW(), NOW()),
('user-qr2', '刘芳', 'QR002', 'QUALITY_REVIEWER', '质量控制部', '13900139002', NOW(), NOW()),
('user-ad1', '陈明', 'AD001', 'ADMIN', '行政管理部', '13700137001', NOW(), NOW());

INSERT INTO "EquipmentRecord" (
  "id", "recordNo", "title", "type", "status", "source", "venue", "eventName",
  "equipmentList", "scheduledTime", "actualTime", "amount", "conclusion",
  "basisAdopted", "blockReason", "remediationPath", "isArchived",
  "creatorId", "currentAssigneeId", "createdAt", "updatedAt"
) VALUES (
  'rec-001', 'REC-2026-0001', '国家体育场田径赛事器材布置验收', 'NORMAL_DELIVERY', 'ARCHIVED',
  '赛事组委会工单', '国家体育场（鸟巢）', '2026年全国田径锦标赛',
  '{"items":[{"name":"跨栏架","quantity":50,"unit":"个"},{"name":"起跑器","quantity":20,"unit":"个"},{"name":"跳高垫","quantity":5,"unit":"张"}]}',
  '2026-03-15 08:00:00+00', '2026-03-15 07:30:00+00', 150000,
  '所有器材按要求布置完成，验收合格',
  '《体育场馆器材布置规范》TY/T 1001-2023',
  NULL, NULL, TRUE,
  'user-ad1', NULL, NOW(), NOW()
);

INSERT INTO "EquipmentRecord" (
  "id", "recordNo", "title", "type", "status", "source", "venue", "eventName",
  "equipmentList", "scheduledTime", "amount", "conclusion",
  "basisAdopted", "blockReason", "remediationPath", "isArchived",
  "creatorId", "currentAssigneeId", "createdAt", "updatedAt"
) VALUES (
  'rec-002', 'REC-2026-0002', '游泳馆跳水赛事器材供应商资格不符', 'QUALIFICATION_MISMATCH', 'RETURNED_FOR_SUPPLEMENT',
  '资格预审系统', '国家游泳中心（水立方）', '2026年国际跳水邀请赛',
  '{"items":[{"name":"跳水池保护垫","quantity":10,"unit":"张"},{"name":"裁判椅","quantity":7,"unit":"个"}]}',
  '2026-04-20 09:00:00+00', 280000,
  '供应商资质过期，需重新提交',
  '《体育器材采购供应商资质审核规范》QJ/ST-003-2025',
  '供应商提供的《体育器材生产许可证》已过期3个月，不符合《赛事器材采购管理规定》第12条要求',
  '1. 立即联系供应商更新资质文件；2. 资质审核通过前暂停所有合作；3. 备用供应商已准备就绪，必要时启动应急预案',
  FALSE,
  'user-ad1', 'user-fh2', NOW(), NOW()
);

INSERT INTO "EquipmentRecord" (
  "id", "recordNo", "title", "type", "status", "source", "venue", "eventName",
  "equipmentList", "scheduledTime", "amount", "conclusion",
  "basisAdopted", "blockReason", "remediationPath", "isArchived",
  "creatorId", "currentAssigneeId", "createdAt", "updatedAt"
) VALUES (
  'rec-003', 'REC-2026-0003', '五棵松篮球馆赛后回收时间窗口冲突', 'TIME_WINDOW_CONFLICT', 'PROCESSING',
  '场馆调度系统', '五棵松体育中心', 'CBA季后赛第四场',
  '{"items":[{"name":"篮球架","quantity":2,"unit":"个"},{"name":"观众席座椅","quantity":500,"unit":"个"},{"name":"电子记分牌","quantity":1,"unit":"套"}]}',
  '2026-05-10 22:00:00+00', 450000,
  '回收时间与次日场馆活动冲突，正在协调',
  '《体育场馆多赛事并行调度管理办法》TY/T 2001-2024',
  '原计划赛后22:00开始回收，但次日08:00有另一活动进场，6小时窗口不足以完成全部器材回收和场地清理',
  '1. 协调赛事组委会延长回收时间至次日02:00；2. 增加回收人员至20人，分两组并行作业；3. 优先回收大型器材，小型器材延后处理',
  FALSE,
  'user-ad1', 'user-fh1', NOW(), NOW()
);

INSERT INTO "EquipmentRecord" (
  "id", "recordNo", "title", "type", "status", "source", "venue", "eventName",
  "equipmentList", "scheduledTime", "amount", "conclusion",
  "basisAdopted", "blockReason", "remediationPath", "isArchived",
  "creatorId", "currentAssigneeId", "createdAt", "updatedAt"
) VALUES (
  'rec-004', 'REC-2026-0004', '网球中心赛事器材进场通知未确认', 'NOTIFICATION_UNCONFIRMED', 'REVIEWING',
  '通知管理系统', '国家网球中心', '2026年中国网球公开赛',
  '{"items":[{"name":"网球网柱","quantity":20,"unit":"个"},{"name":"裁判椅","quantity":20,"unit":"个"},{"name":"球童休息椅","quantity":40,"unit":"个"}]}',
  '2026-06-01 08:00:00+00', 320000,
  '已三次发送进场通知，对方均未确认',
  '《赛事器材供应合同》第8.2条关于通知确认的约定',
  '器材供应商已收到3次进场时间确认通知，但未在规定的24小时内予以确认，可能导致进场延误',
  '1. 已通过电话直接联系供应商负责人；2. 发送正式书面通知并留存送达证据；3. 如48小时内仍无回应，将启动备用供应商',
  FALSE,
  'user-ad1', 'user-qr1', NOW(), NOW()
);

INSERT INTO "RecordNode" ("id", "recordId", "parentNodeId", "nodeType", "status", "description", "fieldNotes", "onSiteNotes", "conclusion", "handlerId", "isArchived", "createdAt") VALUES
('node-001-1', 'rec-001', NULL, '受理登记', 'ACCEPTED', '赛事组委会提交器材布置申请', NULL, NULL, NULL, 'user-ad1', FALSE, NOW()),
('node-001-2', 'rec-001', 'node-001-1', '现场处理', 'PROCESSING', '现场器材布置完成，检查无误', '跨栏架间距准确，跳高垫位置正确', '现场拍照取证，所有器材完好', '布置完成，申请验收', 'user-fh1', FALSE, NOW()),
('node-001-3', 'rec-001', 'node-001-2', '质量复核-确认', 'REVIEWING', '复核通过，所有指标符合要求', NULL, NULL, '复核合格', 'user-qr1', FALSE, NOW()),
('node-001-4', 'rec-001', 'node-001-3', '归档完成', 'ARCHIVED', '记录归档保存', NULL, NULL, '已归档', 'user-qr1', TRUE, NOW()),
('node-002-1', 'rec-002', NULL, '受理登记', 'ACCEPTED', '供应商资格预审申请', NULL, NULL, NULL, 'user-ad1', FALSE, NOW()),
('node-002-2', 'rec-002', 'node-002-1', '现场处理', 'PROCESSING', '发现资质文件过期', '供应商资质证书有效期至2025年12月31日，当前已过期', '已与供应商电话沟通，对方称正在办理续期', '发现资质问题，需进一步处理', 'user-fh2', FALSE, NOW()),
('node-002-3', 'rec-002', 'node-002-2', '质量复核-退回补证', 'RETURNED_FOR_SUPPLEMENT', '退回处理人，要求补充资质证明', '请供应商在3个工作日内提交更新后的资质证书', NULL, '退回补证', 'user-qr2', FALSE, NOW()),
('node-003-1', 'rec-003', NULL, '受理登记', 'ACCEPTED', '赛后器材回收任务登记', NULL, NULL, NULL, 'user-ad1', FALSE, NOW()),
('node-003-2', 'rec-003', 'node-003-1', '现场处理', 'PROCESSING', '发现时间窗口冲突，正在协调解决方案', '与场馆管理方和赛事组委会召开紧急协调会议', '现场评估回收工作量，预计需要8小时完成全部回收', '时间窗口冲突，处理中', 'user-fh1', FALSE, NOW()),
('node-004-1', 'rec-004', NULL, '受理登记', 'ACCEPTED', '器材进场计划登记', NULL, NULL, NULL, 'user-ad1', FALSE, NOW()),
('node-004-2', 'rec-004', 'node-004-1', '现场处理', 'PROCESSING', '发送三次通知，对方未确认', '5月28日、29日、30日三次发送短信+邮件通知', '5月30日下午电话联系，对方称正在内部协调', '通知未确认，已上报复核', 'user-fh2', FALSE, NOW()),
('node-004-3', 'rec-004', 'node-004-2', '质量复核-确认', 'REVIEWING', '复核处理方案，确认补救措施', NULL, NULL, '正在复核中', 'user-qr1', FALSE, NOW());

INSERT INTO "DiffTracker" ("id", "recordId", "nodeId", "fieldName", "changeType", "oldValue", "newValue", "diffDescription", "changedById", "affectsSummary", "createdAt") VALUES
('diff-002-1', 'rec-002', 'node-002-2', '供应商资质', 'EVIDENCE_CONCLUSION', '{"status":"有效","expiryDate":"2025-12-31"}', '{"status":"过期","expiryDate":"2025-12-31"}', '供应商资质已过期，需重新审核', 'user-fh2', TRUE, NOW()),
('diff-003-1', 'rec-003', 'node-003-2', '计划回收时间', 'CRITICAL_TIME', '{"start":"2026-05-10T22:00:00Z","end":"2026-05-11T04:00:00Z"}', '{"start":"2026-05-10T22:00:00Z","end":"2026-05-11T06:00:00Z"}', '回收时间窗口从6小时延长至8小时', 'user-fh1', TRUE, NOW()),
('diff-003-2', 'rec-003', 'node-003-2', '回收作业人员', 'RESPONSIBLE_PARTY', '{"team":"A组","count":10}', '{"team":"A组+B组","count":20}', '增加回收人员以缩短作业时间', 'user-fh1', TRUE, NOW()),
('diff-004-1', 'rec-004', 'node-004-2', '合同金额', 'AMOUNT', '300000', '320000', '因增加备用供应商预案，预算增加2万元', 'user-fh2', TRUE, NOW());

INSERT INTO "KeyObject" ("id", "recordId", "objectType", "objectName", "objectValue", "isCritical", "createdAt") VALUES
('ko-001-1', 'rec-001', '场馆', '国家体育场', '10000人座', TRUE, NOW()),
('ko-001-2', 'rec-001', '赛事', '全国田径锦标赛', '甲级赛事', TRUE, NOW()),
('ko-001-3', 'rec-001', '供应商', '奥健体育器材', '甲级资质', FALSE, NOW()),
('ko-002-1', 'rec-002', '场馆', '国家游泳中心', '甲级场馆', TRUE, NOW()),
('ko-002-2', 'rec-002', '供应商', '华宇体育用品', '资质待更新', TRUE, NOW()),
('ko-002-3', 'rec-002', '赛事', '国际跳水邀请赛', '国际赛事', TRUE, NOW()),
('ko-003-1', 'rec-003', '场馆', '五棵松体育中心', '18000人座', TRUE, NOW()),
('ko-003-2', 'rec-003', '赛事', 'CBA季后赛', '顶级赛事', TRUE, NOW()),
('ko-003-3', 'rec-003', '回收团队', '场馆运维A组', '10人', FALSE, NOW()),
('ko-004-1', 'rec-004', '场馆', '国家网球中心', '主赛场+训练场', TRUE, NOW()),
('ko-004-2', 'rec-004', '供应商', '网球世家器材', '未确认通知', TRUE, NOW()),
('ko-004-3', 'rec-004', '备用供应商', '金满贯体育', '待命状态', FALSE, NOW());

INSERT INTO "Attachment" ("id", "recordId", "nodeId", "fileName", "fileType", "fileUrl", "description", "uploadedById", "createdAt") VALUES
('att-001-1', 'rec-001', 'node-001-2', '现场布置照片.jpg', 'image/jpeg', '/attachments/rec001-photo1.jpg', '跨栏架布置全景照', 'user-fh1', NOW()),
('att-001-2', 'rec-001', 'node-001-4', '验收确认单.pdf', 'application/pdf', '/attachments/rec001-doc1.pdf', '双方签字确认的验收单', 'user-qr1', NOW()),
('att-002-1', 'rec-002', 'node-002-2', '过期资质证书扫描件.pdf', 'application/pdf', '/attachments/rec002-cert-expired.pdf', '供应商提供的过期资质证书', 'user-fh2', NOW()),
('att-003-1', 'rec-003', 'node-003-2', '场馆日程冲突截图.png', 'image/png', '/attachments/rec003-schedule-conflict.png', '场馆日程系统显示的时间冲突', 'user-fh1', NOW()),
('att-003-2', 'rec-003', 'node-003-2', '协调会议纪要.docx', 'application/docx', '/attachments/rec003-meeting-notes.docx', '三方协调会议纪要', 'user-fh1', NOW()),
('att-004-1', 'rec-004', 'node-004-2', '通知发送记录截图.png', 'image/png', '/attachments/rec004-notification-log.png', '三次通知的发送记录', 'user-fh2', NOW()),
('att-004-2', 'rec-004', 'node-004-2', '电话通话录音.mp3', 'audio/mpeg', '/attachments/rec004-call-recording.mp3', '与供应商的电话沟通录音', 'user-fh2', NOW()),
('att-004-3', 'rec-004', 'node-004-3', '备用供应商协议.pdf', 'application/pdf', '/attachments/rec004-backup-agreement.pdf', '与备用供应商的框架协议', 'user-qr1', NOW());
