-- 清理旧数据
TRUNCATE TABLE "FieldDifference" CASCADE;
TRUNCATE TABLE "ReviewRecord" CASCADE;
TRUNCATE TABLE "OrderAttachment" CASCADE;
TRUNCATE TABLE "OrderNode" CASCADE;
TRUNCATE TABLE "DispatchOrder" CASCADE;
TRUNCATE TABLE "User" CASCADE;

-- 插入用户
INSERT INTO "User" ("id", "name", "role", "createdAt", "updatedAt") VALUES
('user-op-001', '李操作员', 'OPERATOR', NOW(), NOW()),
('user-op-002', '王操作员', 'OPERATOR', NOW(), NOW()),
('user-rv-001', '张复核员', 'REVIEWER', NOW(), NOW()),
('user-admin-001', '赵管理员', 'ADMIN', NOW(), NOW());

-- 样本1：正常闭环
INSERT INTO "DispatchOrder" (
  "id", "orderNo", "title", "content", "source", "sourceDept",
  "status", "sampleCategory",
  "gateNo", "reservoirName", "targetOpening", "targetFlow", "planExecuteTime",
  "responsibleUnit", "responsiblePerson",
  "actualOpening", "actualFlow", "actualExecuteTime", "reviewTime",
  "blockReason", "remedyPath",
  "summary", "conclusion",
  "isArchived", "createdAt", "updatedAt"
) VALUES (
  'order-001', 'SLUICE-20260610-0001', '主汛期1号闸门泄洪调度',
  '接调度中心指令，开启1号闸门泄洪，目标开度1.5m，目标流量300m³/s',
  '调度中心指令', '流域调度中心',
  'ARCHIVED', 'NORMAL_CLOSE',
  '1号闸', '青山水库', 1.5, 300, NOW() - INTERVAL '12 days',
  '闸门运维一班', '张班长',
  1.5, 300, NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days',
  NULL, NULL,
  '正常完成', '执行规范，数据完整，符合调度要求',
  true, NOW() - INTERVAL '12 days', NOW() - INTERVAL '7 days'
);

-- 样本2：关键材料缺失
INSERT INTO "DispatchOrder" (
  "id", "orderNo", "title", "content", "source", "sourceDept",
  "status", "sampleCategory",
  "gateNo", "reservoirName", "targetOpening", "targetFlow", "planExecuteTime",
  "responsibleUnit", "responsiblePerson",
  "actualOpening", "actualFlow", "actualExecuteTime",
  "blockReason", "remedyPath",
  "summary", "conclusion",
  "isArchived", "createdAt", "updatedAt"
) VALUES (
  'order-002', 'SLUICE-20260610-0002', '2号闸门日常维护后试运行',
  '2号闸门完成年度维护后进行试运行，开启0.5m，持续2小时',
  '运维申请', '工程运维部',
  'PROCESSING', 'MISSING_MATERIAL',
  '2号闸', '青山水库', 0.5, 50, NOW() - INTERVAL '6 days',
  '闸门运维一班', '张班长',
  0.5, 50, NOW() - INTERVAL '4 days',
  '缺少闸门安全检定证书，无法确认设备状态',
  '1. 联系质检部门索取检定证书扫描件；2. 补充上传至附件后提交复核；3. 复核通过后方可归档',
  '材料缺失', '待补充闸门安全检定证书',
  false, NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days'
);

-- 样本3：责任对象不一致
INSERT INTO "DispatchOrder" (
  "id", "orderNo", "title", "content", "source", "sourceDept",
  "status", "sampleCategory",
  "gateNo", "reservoirName", "targetOpening", "targetFlow", "planExecuteTime",
  "responsibleUnit", "responsiblePerson",
  "actualOpening", "actualFlow", "actualExecuteTime",
  "blockReason", "remedyPath",
  "summary", "conclusion",
  "isArchived", "createdAt", "updatedAt"
) VALUES (
  'order-003', 'SLUICE-20260610-0003', '3号闸门应急调度',
  '接应急指挥中心通知，紧急开启3号闸门泄洪，目标开度2.0m',
  '应急指令', '应急指挥中心',
  'PENDING_REVIEW', 'INCONSISTENT_PARTY',
  '3号闸', '青山水库', 2.0, 500, NOW() - INTERVAL '3 days',
  '应急抢险队', '王队长',
  2.0, 500, NOW() - INTERVAL '1 day',
  '执行单位由原"闸门运维一班"变更为"应急抢险队"，责任人由"张班长"变更为"王队长"',
  '1. 应急调度总指挥签字确认变更；2. 补充变更说明文件；3. 复核人确认变更合规性',
  '责任变更', '执行完成，责任单位变更说明已附',
  false, NOW() - INTERVAL '3 days', NOW()
);

-- 样本4：复核退回
INSERT INTO "DispatchOrder" (
  "id", "orderNo", "title", "content", "source", "sourceDept",
  "status", "sampleCategory",
  "gateNo", "reservoirName", "targetOpening", "targetFlow", "planExecuteTime",
  "responsibleUnit", "responsiblePerson",
  "actualOpening", "actualFlow", "actualExecuteTime", "reviewTime",
  "blockReason", "remedyPath",
  "summary", "conclusion",
  "isArchived", "createdAt", "updatedAt"
) VALUES (
  'order-004', 'SLUICE-20260610-0004', '4号闸门日常调度',
  '日常调度，开启4号闸门，目标开度1.5m，目标流量300m³/s',
  '调度中心指令', '流域调度中心',
  'PROCESSING', 'REVIEW_REJECTED',
  '4号闸', '青山水库', 1.5, 300, NOW() - INTERVAL '1 day',
  '闸门运维二班', '李班长',
  1.8, 380, NOW(), NOW(),
  '实际开度1.8m与目标开度1.5m偏差达20%，超出±5%允许范围；实际流量380m³/s与目标300m³/s偏差27%',
  '1. 分析开度偏差原因（机械故障/操作误差）；2. 制定纠正措施并落实；3. 重新执行调度或提交偏差说明；4. 整改完成后再次提交复核',
  '复核退回', '执行偏差待整改',
  false, NOW() - INTERVAL '1 day', NOW()
);

-- 历史节点
INSERT INTO "OrderNode" ("id", "orderId", "nodeType", "status", "operatorId", "operatorName", "remark", "snapshotData", "createdAt") VALUES
-- 样本1节点
('node-001', 'order-001', 'ACCEPT', 'PENDING_ACCEPT', 'user-admin-001', '赵管理员', '调度中心下发泄洪指令', '{}', NOW() - INTERVAL '12 days'),
('node-002', 'order-001', 'ACCEPT', 'PROCESSING', 'user-op-001', '李操作员', '受理指令，安排执行', '{}', NOW() - INTERVAL '11 days'),
('node-003', 'order-001', 'PROCESS', 'PROCESSING', 'user-op-001', '李操作员', '现场执行闸门开启操作，运行正常', '{}', NOW() - INTERVAL '10 days'),
('node-004', 'order-001', 'SUBMIT_REVIEW', 'PENDING_REVIEW', 'user-op-001', '李操作员', '执行完成，提交复核', '{}', NOW() - INTERVAL '9 days'),
('node-005', 'order-001', 'APPROVE', 'REVIEW_APPROVED', 'user-rv-001', '张复核员', '复核通过，同意归档', '{}', NOW() - INTERVAL '8 days'),
('node-006', 'order-001', 'ARCHIVE', 'ARCHIVED', 'user-rv-001', '张复核员', '指令完成归档', '{}', NOW() - INTERVAL '7 days'),

-- 样本2节点
('node-007', 'order-002', 'ACCEPT', 'PENDING_ACCEPT', 'user-op-001', '李操作员', '运维部提交试运行申请', '{}', NOW() - INTERVAL '6 days'),
('node-008', 'order-002', 'ACCEPT', 'PROCESSING', 'user-op-001', '李操作员', '受理试运行申请', '{}', NOW() - INTERVAL '6 days'),
('node-009', 'order-002', 'PROCESS', 'PROCESSING', 'user-op-002', '王操作员', '执行试运行，闸门运行正常', '{}', NOW() - INTERVAL '4 days'),
('node-010', 'order-002', 'SUBMIT_REVIEW', 'PENDING_REVIEW', 'user-op-002', '王操作员', '申请复核', '{}', NOW() - INTERVAL '4 days'),
('node-011', 'order-002', 'REJECT', 'PROCESSING', 'user-rv-001', '张复核员', '复核退回：缺少闸门安全检定证书', '{}', NOW() - INTERVAL '3 days'),

-- 样本3节点
('node-012', 'order-003', 'ACCEPT', 'PENDING_ACCEPT', 'user-admin-001', '赵管理员', '应急指挥中心下发紧急调度', '{}', NOW() - INTERVAL '3 days'),
('node-013', 'order-003', 'ACCEPT', 'PROCESSING', 'user-op-001', '李操作员', '受理应急指令', '{}', NOW() - INTERVAL '3 days'),
('node-014', 'order-003', 'PROCESS', 'PROCESSING', 'user-op-001', '李操作员', '应急抢险队执行调度，责任单位变更', '{}', NOW() - INTERVAL '1 day'),
('node-015', 'order-003', 'SUBMIT_REVIEW', 'PENDING_REVIEW', 'user-op-001', '李操作员', '执行完成待复核', '{}', NOW()),

-- 样本4节点
('node-016', 'order-004', 'ACCEPT', 'PENDING_ACCEPT', 'user-admin-001', '赵管理员', '调度中心下发日常调度', '{}', NOW() - INTERVAL '1 day'),
('node-017', 'order-004', 'ACCEPT', 'PROCESSING', 'user-op-001', '李操作员', '受理调度指令', '{}', NOW() - INTERVAL '1 day'),
('node-018', 'order-004', 'PROCESS', 'PROCESSING', 'user-op-002', '王操作员', '执行调度，实际开度1.8m', '{}', NOW()),
('node-019', 'order-004', 'SUBMIT_REVIEW', 'PENDING_REVIEW', 'user-op-002', '王操作员', '申请复核', '{}', NOW()),
('node-020', 'order-004', 'REJECT', 'PROCESSING', 'user-rv-001', '张复核员', '复核退回：开度偏差超出允许范围', '{}', NOW());

-- 更新 currentNodeId
UPDATE "DispatchOrder" SET "currentNodeId" = 'node-006' WHERE id = 'order-001';
UPDATE "DispatchOrder" SET "currentNodeId" = 'node-011' WHERE id = 'order-002';
UPDATE "DispatchOrder" SET "currentNodeId" = 'node-015' WHERE id = 'order-003';
UPDATE "DispatchOrder" SET "currentNodeId" = 'node-020' WHERE id = 'order-004';

-- 附件
INSERT INTO "OrderAttachment" ("id", "orderId", "nodeId", "name", "type", "size", "url", "uploadedBy", "description", "uploadedAt") VALUES
('att-001', 'order-001', 'node-003', '现场执行照片.jpg', 'image/jpeg', 2048000, '/attachments/sample1-1.jpg', 'user-op-001', '1号闸门开度照片', NOW() - INTERVAL '9 days'),
('att-002', 'order-001', 'node-003', '流量记录单.pdf', 'application/pdf', 512000, '/attachments/sample1-2.pdf', 'user-op-001', '下泄流量实时记录', NOW() - INTERVAL '9 days');

-- 字段差异记录
INSERT INTO "FieldDifference" ("id", "orderId", "nodeId", "fieldName", "fieldLabel", "oldValue", "newValue", "differenceType", "changedBy", "changedAt") VALUES
-- 样本3：责任对象变更
('diff-001', 'order-003', 'node-014', 'responsibleUnit', '责任单位', '闸门运维一班', '应急抢险队', 'RESPONSIBLE_PARTY', 'user-op-001', NOW() - INTERVAL '1 day'),
('diff-002', 'order-003', 'node-014', 'responsiblePerson', '责任人', '张班长', '王队长', 'RESPONSIBLE_PARTY', 'user-op-001', NOW() - INTERVAL '1 day'),
('diff-003', 'order-003', 'node-014', 'actualExecuteTime', '实际执行时间', (NOW() - INTERVAL '2 days')::text, (NOW() - INTERVAL '1 day')::text, 'KEY_TIME', 'user-op-001', NOW() - INTERVAL '1 day'),

-- 样本4：金额/数量差异
('diff-004', 'order-004', 'node-018', 'actualOpening', '实际开度', '1.5', '1.8', 'AMOUNT', 'user-op-001', NOW()),
('diff-005', 'order-004', 'node-018', 'actualFlow', '实际流量', '300', '380', 'AMOUNT', 'user-op-001', NOW()),
('diff-006', 'order-004', 'node-020', 'conclusion', '结论', '执行完成', '执行偏差待整改', 'EVIDENCE_CONCLUSION', 'user-rv-001', NOW());

-- 复核记录
INSERT INTO "ReviewRecord" ("id", "orderId", "reviewerId", "reviewerName", "conclusion", "opinion", "isApproved", "reviewedAt") VALUES
('review-001', 'order-001', 'user-rv-001', '张复核员', '执行规范，数据完整', '同意归档', true, NOW() - INTERVAL '8 days'),
('review-002', 'order-002', 'user-rv-001', '张复核员', '缺少关键材料', '请补充闸门安全检定证书后重新提交', false, NOW() - INTERVAL '3 days'),
('review-003', 'order-004', 'user-rv-001', '张复核员', '执行偏差超标', '开度偏差20%，超出±5%允许范围，请分析原因并整改', false, NOW());
