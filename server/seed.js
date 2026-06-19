const now = new Date('2026-06-20T08:00:00Z');
const ISO = (daysOffset, hour, minute = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const seedTeams = [
  { id: 'team-alpha', name: '阿尔法班组', leader: '张建国', members: ['张建国', '李明', '王海', '赵磊'] },
  { id: 'team-beta', name: '贝塔班组', leader: '陈志强', members: ['陈志强', '刘伟', '孙涛'] },
  { id: 'team-gamma', name: '伽马班组', leader: '周文博', members: ['周文博', '吴昊', '郑宇', '冯斌', '何杰'] },
  { id: 'team-delta', name: '德尔塔班组', leader: '林浩然', members: ['林浩然', '黄山', '徐明'] },
];

const seedPartBatches = [
  { id: 'PB-001', name: '主轴承密封组件', category: '传动系统', totalStock: 4, unit: '套' },
  { id: 'PB-002', name: '变桨电机', category: '变桨系统', totalStock: 6, unit: '台' },
  { id: 'PB-003', name: '偏航制动片', category: '偏航系统', totalStock: 20, unit: '片' },
  { id: 'PB-004', name: '齿轮油合成型', category: '润滑耗材', totalStock: 500, unit: '升' },
  { id: 'PB-005', name: '风速传感器', category: '控制系统', totalStock: 8, unit: '个' },
  { id: 'PB-006', name: '叶片前缘修复套装', category: '叶片维护', totalStock: 3, unit: '套' },
  { id: 'PB-007', name: '液压油站滤芯', category: '液压系统', totalStock: 12, unit: '个' },
  { id: 'PB-008', name: '塔筒连接螺栓M36', category: '结构件', totalStock: 2, unit: '箱(50颗/箱)' },
];

const seedWorkOrders = [
  {
    id: 'wo-001', code: 'WG-2026-0001', turbineId: 'WT-A01', towerSection: 'nacelle',
    title: '主轴承定期检查与润滑', description: '例行季度检查，主轴承润滑脂更换，密封件外观检查。',
    startTime: ISO(2, 8), endTime: ISO(2, 14),
    parts: [{ partBatchId: 'PB-004', partName: '齿轮油合成型', quantity: 60 }],
    teamId: 'team-alpha', riskLevel: 'medium',
    riskDescription: '机舱内作业，存在高空坠落风险。',
    safetyConfirmed: true, status: 'approved',
    createdAt: ISO(-3, 10), updatedAt: ISO(-1, 14),
    createdBy: '运维调度员', approvedBy: '检修主管', approvedAt: ISO(-1, 14),
  },
  {
    id: 'wo-002', code: 'WG-2026-0002', turbineId: 'WT-A03', towerSection: 'blade_1',
    title: '叶片前缘裂纹修复', description: '1号叶片前缘发现约80cm裂纹，需使用修复套装现场处理。',
    startTime: ISO(3, 7, 30), endTime: ISO(4, 17),
    parts: [{ partBatchId: 'PB-006', partName: '叶片前缘修复套装', quantity: 1 }],
    teamId: 'team-gamma', riskLevel: 'high',
    riskDescription: '悬吊作业，高空强风环境，需双安全带系挂。',
    safetyConfirmed: false, status: 'approved',
    createdAt: ISO(-2, 9), updatedAt: ISO(0, 11),
    createdBy: '运维调度员', approvedBy: '检修主管', approvedAt: ISO(0, 11),
  },
  {
    id: 'wo-003', code: 'WG-2026-0003', turbineId: 'WT-A05', towerSection: 'tower_lower',
    title: '塔筒下段防腐处理', description: '塔筒下段海雾盐蚀区域重新做防腐涂层。',
    startTime: ISO(4, 9), endTime: ISO(6, 18),
    parts: [{ partBatchId: 'PB-003', partName: '偏航制动片', quantity: 4 }],
    teamId: 'team-beta', riskLevel: 'medium',
    riskDescription: '密闭空间作业，需通风与气体检测。',
    safetyConfirmed: true, status: 'in_progress',
    createdAt: ISO(-5, 14), updatedAt: ISO(1, 8),
    createdBy: '运维调度员', approvedBy: '检修主管', approvedAt: ISO(-4, 10),
  },
  {
    id: 'wo-004', code: 'WG-2026-0004', turbineId: 'WT-A07', towerSection: 'nacelle',
    title: '齿轮油更换与过滤', description: '年度齿轮箱油更换，配套滤芯更换与油样检测。',
    startTime: ISO(1, 8), endTime: ISO(2, 16),
    parts: [
      { partBatchId: 'PB-004', partName: '齿轮油合成型', quantity: 200 },
      { partBatchId: 'PB-007', partName: '液压油站滤芯', quantity: 2 },
    ],
    teamId: 'team-alpha', riskLevel: 'medium',
    riskDescription: '大型部件吊装，需指挥信号清晰。',
    safetyConfirmed: true, status: 'approved',
    createdAt: ISO(-4, 11), updatedAt: ISO(-1, 9),
    createdBy: '运维调度员', approvedBy: '检修主管', approvedAt: ISO(-2, 16),
  },
  {
    id: 'wo-005', code: 'WG-2026-0005', turbineId: 'WT-A09', towerSection: 'hub',
    title: '变桨电机更换', description: '2号变桨电机异响，整体更换并做参数校准。',
    startTime: ISO(5, 9), endTime: ISO(5, 17),
    parts: [{ partBatchId: 'PB-002', partName: '变桨电机', quantity: 1 }],
    teamId: 'team-delta', riskLevel: 'medium',
    riskDescription: '轮毂内狭小空间作业，注意工具坠落。',
    safetyConfirmed: true, status: 'pending',
    createdAt: ISO(-1, 10), updatedAt: ISO(0, 9),
    createdBy: '运维调度员',
  },
  {
    id: 'wo-006', code: 'WG-2026-0006', turbineId: 'WT-A02', towerSection: 'tower_upper',
    title: '风速传感器校验', description: '风速仪读数偏差超过5%，需现场校准或更换。',
    startTime: ISO(0, 10), endTime: ISO(0, 14),
    parts: [{ partBatchId: 'PB-005', partName: '风速传感器', quantity: 1 }],
    teamId: 'team-beta', riskLevel: 'low',
    riskDescription: '塔筒上部平台作业，空间相对充裕。',
    safetyConfirmed: true, status: 'completed',
    createdAt: ISO(-7, 14), updatedAt: ISO(-1, 16),
    createdBy: '运维调度员', approvedBy: '检修主管', approvedAt: ISO(-6, 9),
    completedAt: ISO(-1, 15, 30),
  },
  {
    id: 'wo-007', code: 'WG-2026-0007', turbineId: 'WT-A01', towerSection: 'tower_middle',
    title: '塔筒中段灯具更换（草稿）', description: '中段照明LED故障，计划更换整串灯具。',
    startTime: ISO(2, 13), endTime: ISO(2, 17),
    parts: [{ partBatchId: 'PB-004', partName: '齿轮油合成型', quantity: 20 }],
    teamId: 'team-gamma', riskLevel: 'low',
    riskDescription: '常规灯具维护，风险较低。',
    safetyConfirmed: false, status: 'draft',
    createdAt: ISO(0, 14), updatedAt: ISO(0, 14),
    createdBy: '检修主管',
  },
  {
    id: 'wo-008', code: 'WG-2026-0008', turbineId: 'WT-A10', towerSection: 'nacelle',
    title: '主轴承更换大修', description: '主轴承异响严重，需整体吊装更换，作业风险极高。',
    startTime: ISO(7, 8), endTime: ISO(10, 18),
    parts: [
      { partBatchId: 'PB-001', partName: '主轴承密封组件', quantity: 2 },
      { partBatchId: 'PB-004', partName: '齿轮油合成型', quantity: 150 },
    ],
    teamId: 'team-delta', riskLevel: 'critical',
    riskDescription: '机舱大型部件拆解重装，存在装配精度要求极高。',
    safetyConfirmed: false, status: 'approved',
    createdAt: ISO(-10, 9), updatedAt: ISO(0, 10),
    createdBy: '运维调度员', approvedBy: '检修主管', approvedAt: ISO(-8, 14),
    locked: true, lockedBy: '检修主管', lockedAt: ISO(0, 10),
  },
  {
    id: 'wo-009', code: 'WG-2026-0009', turbineId: 'WT-A08', towerSection: 'blade_2',
    title: '2号叶片前缘修复（延期）', description: '叶片前缘侵蚀修复，使用专用修复套装。',
    startTime: ISO(3, 8), endTime: ISO(4, 17),
    parts: [{ partBatchId: 'PB-006', partName: '叶片前缘修复套装', quantity: 1 }],
    teamId: 'team-alpha', riskLevel: 'high',
    riskDescription: '高空悬吊作业，天气窗口窄。',
    safetyConfirmed: false, status: 'delayed',
    createdAt: ISO(-3, 11), updatedAt: ISO(0, 16),
    createdBy: '运维调度员', approvedBy: '检修主管', approvedAt: ISO(-2, 10),
    delayReason: '天气原因，风速超标无法作业',
  },
  {
    id: 'wo-010', code: 'WG-2026-0010', turbineId: 'WT-A04', towerSection: 'foundation',
    title: '基础基座渗水检查', description: '基础环发现渗水痕迹，需排查密封并注浆。',
    startTime: ISO(6, 9), endTime: ISO(7, 17),
    parts: [{ partBatchId: 'PB-003', partName: '偏航制动片', quantity: 8 }],
    teamId: 'team-beta', riskLevel: 'low',
    riskDescription: '基础内部作业，无高空风险。',
    safetyConfirmed: true, status: 'approved',
    createdAt: ISO(-1, 15), updatedAt: ISO(0, 11),
    createdBy: '运维调度员', approvedBy: '检修主管', approvedAt: ISO(0, 9),
  },
  {
    id: 'wo-011', code: 'WG-2026-0011', turbineId: 'WT-A06', towerSection: 'tower_lower',
    title: '塔筒螺栓力矩复检', description: '下段塔筒连接螺栓全部力矩复检与标记。',
    startTime: ISO(2, 9), endTime: ISO(3, 18),
    parts: [{ partBatchId: 'PB-008', partName: '塔筒连接螺栓M36', quantity: 3 }],
    teamId: 'team-gamma', riskLevel: 'medium',
    riskDescription: '人工搬运重型套筒，注意腰背防护。',
    safetyConfirmed: true, status: 'missing_parts',
    createdAt: ISO(-2, 16), updatedAt: ISO(0, 14),
    createdBy: '运维调度员', approvedBy: '检修主管', approvedAt: ISO(-1, 11),
  },
  {
    id: 'wo-012', code: 'WG-2026-0012', turbineId: 'WT-A11', towerSection: 'hub',
    title: '轮毂变桨轴承润滑', description: '变桨轴承补充润滑脂，检查齿面磨损。',
    startTime: ISO(5, 9), endTime: ISO(6, 12),
    parts: [{ partBatchId: 'PB-007', partName: '液压油站滤芯', quantity: 1 }],
    teamId: 'team-delta', riskLevel: 'medium',
    riskDescription: '轮毂内作业，空间狭窄。',
    safetyConfirmed: true, status: 'approved',
    createdAt: ISO(-5, 10), updatedAt: ISO(-3, 9),
    createdBy: '运维调度员', approvedBy: '检修主管', approvedAt: ISO(-4, 14),
  },
];

const seedApprovals = [
  {
    id: 'ap-001', workOrderId: 'wo-001', action: 'submit',
    operator: '运维调度员', operatorRole: '运维调度员',
    timestamp: ISO(-2, 10), comment: '提交审批，例行维护工单。',
  },
  {
    id: 'ap-002', workOrderId: 'wo-001', action: 'approve',
    operator: '检修主管', operatorRole: '检修主管',
    timestamp: ISO(-1, 14), comment: '批准，注意安全确认。',
  },
  {
    id: 'ap-003', workOrderId: 'wo-002', action: 'submit',
    operator: '运维调度员', operatorRole: '运维调度员',
    timestamp: ISO(-1, 15), comment: '紧急缺陷工单，叶片裂纹需尽快处理。',
  },
  {
    id: 'ap-004', workOrderId: 'wo-002', action: 'approve',
    operator: '检修主管', operatorRole: '检修主管',
    timestamp: ISO(0, 11), comment: '批准，安全确认必须到位。',
  },
  {
    id: 'ap-005', workOrderId: 'wo-003', action: 'submit',
    operator: '运维调度员', operatorRole: '运维调度员',
    timestamp: ISO(-5, 15), comment: '防腐工程工单。',
  },
  {
    id: 'ap-006', workOrderId: 'wo-003', action: 'approve',
    operator: '检修主管', operatorRole: '检修主管',
    timestamp: ISO(-4, 10), comment: '批准。',
  },
  {
    id: 'ap-007', workOrderId: 'wo-004', action: 'submit',
    operator: '运维调度员', operatorRole: '运维调度员',
    timestamp: ISO(-4, 12), comment: '年度齿轮油更换。',
  },
  {
    id: 'ap-008', workOrderId: 'wo-004', action: 'approve',
    operator: '检修主管', operatorRole: '检修主管',
    timestamp: ISO(-2, 16), comment: '批准，注意油品型号。',
  },
  {
    id: 'ap-009', workOrderId: 'wo-005', action: 'submit',
    operator: '运维调度员', operatorRole: '运维调度员',
    timestamp: ISO(0, 10), comment: '变桨电机更换。',
  },
  {
    id: 'ap-010', workOrderId: 'wo-006', action: 'submit',
    operator: '运维调度员', operatorRole: '运维调度员',
    timestamp: ISO(-7, 15), comment: '风速传感器校准。',
  },
  {
    id: 'ap-011', workOrderId: 'wo-006', action: 'approve',
    operator: '检修主管', operatorRole: '检修主管',
    timestamp: ISO(-6, 9), comment: '批准。',
  },
  {
    id: 'ap-012', workOrderId: 'wo-006', action: 'complete',
    operator: '运维调度员', operatorRole: '运维调度员',
    timestamp: ISO(-1, 15, 30), comment: '现场校准完成，偏差在允许范围内。',
  },
  {
    id: 'ap-013', workOrderId: 'wo-008', action: 'submit',
    operator: '运维调度员', operatorRole: '运维调度员',
    timestamp: ISO(-10, 10), comment: '大修工单，主轴承更换。',
  },
  {
    id: 'ap-014', workOrderId: 'wo-008', action: 'approve',
    operator: '检修主管', operatorRole: '检修主管',
    timestamp: ISO(-8, 14), comment: '批准，已锁定计划排期。',
  },
  {
    id: 'ap-015', workOrderId: 'wo-009', action: 'submit',
    operator: '运维调度员', operatorRole: '运维调度员',
    timestamp: ISO(-3, 12), comment: '叶片修复工单。',
  },
  {
    id: 'ap-016', workOrderId: 'wo-009', action: 'approve',
    operator: '检修主管', operatorRole: '检修主管',
    timestamp: ISO(-2, 10), comment: '批准，关注天气窗口。',
  },
  {
    id: 'ap-017', workOrderId: 'wo-009', action: 'delay',
    operator: '运维调度员', operatorRole: '运维调度员',
    timestamp: ISO(0, 16), comment: '人员调配延期执行',
  },
  {
    id: 'ap-018', workOrderId: 'wo-011', action: 'submit',
    operator: '运维调度员', operatorRole: '运维调度员',
    timestamp: ISO(-2, 17), comment: '螺栓力矩复检。',
  },
];

const seedAuditLogs = [
  {
    id: 'log-init-001', action: 'system_init', entityType: 'system',
    entityId: 'system', operator: 'system',
    timestamp: ISO(-30, 0), details: { event: '系统初始化，加载预置数据' },
  },
  {
    id: 'log-init-002', action: 'seed_work_order', entityType: 'work_order',
    entityId: 'wo-001', operator: 'system',
    timestamp: ISO(-7, 0), details: { code: 'WG-2026-0001', source: '预置数据' },
  },
  {
    id: 'log-init-003', action: 'conflict_recalc', entityType: 'conflict_recalc',
    entityId: 'initial', operator: 'system',
    timestamp: ISO(0, 8), details: { total: 7, byType: { safety_unconfirmed: 2, part_shortage: 1, window_overlap: 1, part_overlap: 3 } },
  },
];

const seedUI = {
  selectedDate: new Date('2026-06-20').toISOString(),
  showWorkOrderModal: false,
  showExportModal: false,
  activeTab: 'calendar',
  matrixWeekOffset: 0,
  matrixSelectedPartId: 'all',
  rightPanelTab: 'approvals',
};

module.exports = {
  seedWorkOrders,
  seedPartBatches,
  seedTeams,
  seedApprovals,
  seedAuditLogs,
  seedUI,
};
