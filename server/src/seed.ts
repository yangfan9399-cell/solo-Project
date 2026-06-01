import db, { initDatabase } from './db.js';

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function seedData() {
  initDatabase();

  const now = new Date().toISOString();

  const users = [
    { id: 'user_001', name: '张工', role: 'chemist', phone: '13800138001', department: '水质检测中心' },
    { id: 'user_002', name: '李工', role: 'chemist', phone: '13800138002', department: '水质检测中心' },
    { id: 'user_003', name: '王队', role: 'repair_crew', phone: '13800138003', department: '管网抢修一队' },
    { id: 'user_004', name: '刘队', role: 'repair_crew', phone: '13800138004', department: '管网抢修二队' },
    { id: 'user_005', name: '陈客服', role: 'hotline', phone: '13800138005', department: '客户服务中心' },
    { id: 'user_006', name: '周主管', role: 'admin', phone: '13800138006', department: '调度中心' },
  ];

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, name, role, phone, department, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertLocation = db.prepare(`
    INSERT OR REPLACE INTO locations (id, name, type, address, area, population, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRepairTeam = db.prepare(`
    INSERT OR REPLACE INTO repair_teams (id, name, leader, leader_phone, members, area, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertWaterQualityTest = db.prepare(`
    INSERT OR REPLACE INTO water_quality_tests (
      id, test_date, location_id, location_name, ph, turbidity, residual_chlorine, coliform,
      status, tested_by, tester_name, remark, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRepairReport = db.prepare(`
    INSERT OR REPLACE INTO repair_reports (
      id, report_no, type, title, description, location, address, contact_name, contact_phone,
      affected_area, affected_population, urgency, status, reported_by, reporter_name, reporter_role,
      assigned_to, assignee_name, water_stop_needed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertWorkOrder = db.prepare(`
    INSERT OR REPLACE INTO work_orders (
      id, order_no, repair_report_id, title, description, location, team_id, team_name,
      team_members, priority, status, estimated_start, estimated_end, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertWaterStopNotice = db.prepare(`
    INSERT OR REPLACE INTO water_stop_notices (
      id, notice_no, title, content, affected_area, affected_population, start_time, end_time,
      reason, status, published, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNotification = db.prepare(`
    INSERT OR REPLACE INTO notifications (
      id, type, title, content, target_roles, is_read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRecheckRecord = db.prepare(`
    INSERT OR REPLACE INTO recheck_records (
      id, water_quality_test_id, recheck_date, ph, turbidity, residual_chlorine, coliform,
      result, rechecked_by, rechecker_name, remark, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    users.forEach(user => insertUser.run(user.id, user.name, user.role, user.phone, user.department, now));

    const locations = [
      { id: 'loc_001', name: '第一水厂', type: 'water_plant', address: '城东区水厂路1号', area: '城东区', population: 50000 },
      { id: 'loc_002', name: '第二水厂', type: 'water_plant', address: '城西区清水路88号', area: '城西区', population: 45000 },
      { id: 'loc_003', name: '城东管网监测点A', type: 'pipe_network', address: '城东区人民路与建设路交叉口', area: '城东区', population: 15000 },
      { id: 'loc_004', name: '阳光花园小区', type: 'community', address: '城南区阳光大道168号', area: '城南区', population: 8000 },
      { id: 'loc_005', name: '锦绣家园小区', type: 'community', address: '城北区锦绣路256号', area: '城北区', population: 6500 },
      { id: 'loc_006', name: '工业园区A区', type: 'factory', address: '工业园区创业路1号', area: '工业园区', population: 3000 },
    ];
    locations.forEach(loc => insertLocation.run(loc.id, loc.name, loc.type, loc.address, loc.area, loc.population, now));

    const teams = [
      { id: 'team_001', name: '管网抢修一队', leader: '王队', leader_phone: '13800138003', members: '王队、赵刚、孙明', area: '城东区、城南区', status: 'available' },
      { id: 'team_002', name: '管网抢修二队', leader: '刘队', leader_phone: '13800138004', members: '刘队、钱伟、周强', area: '城西区、城北区', status: 'busy' },
      { id: 'team_003', name: '管网抢修三队', leader: '吴队', leader_phone: '13800138007', members: '吴队、郑华、冯杰', area: '工业园区', status: 'available' },
    ];
    teams.forEach(team => insertRepairTeam.run(team.id, team.name, team.leader, team.leader_phone, team.members, team.area, team.status, now));

    const tests = [
      { id: 'wq_001', test_date: '2026-05-30', locationId: 'loc_001', locationName: '第一水厂', ph: 7.2, turbidity: 0.5, residualChlorine: 0.8, coliform: 0, status: 'normal', testedBy: 'user_001', testerName: '张工' },
      { id: 'wq_002', test_date: '2026-05-30', locationId: 'loc_002', locationName: '第二水厂', ph: 7.5, turbidity: 0.3, residualChlorine: 1.0, coliform: 0, status: 'normal', testedBy: 'user_002', testerName: '李工' },
      { id: 'wq_003', test_date: '2026-05-31', locationId: 'loc_003', locationName: '城东管网监测点A', ph: 8.8, turbidity: 3.5, residualChlorine: 0.2, coliform: 15, status: 'abnormal', testedBy: 'user_001', testerName: '张工', remark: 'pH值偏高，浊度超标，余氯不足，检出大肠菌群' },
      { id: 'wq_004', test_date: '2026-05-31', locationId: 'loc_004', locationName: '阳光花园小区', ph: 7.3, turbidity: 0.6, residualChlorine: 0.7, coliform: 0, status: 'normal', testedBy: 'user_002', testerName: '李工' },
    ];
    tests.forEach(t => insertWaterQualityTest.run(
      t.id, t.test_date, t.locationId, t.locationName, t.ph, t.turbidity, t.residualChlorine, t.coliform,
      t.status, t.testedBy, t.testerName, t.remark || null, now, now
    ));

    const reports = [
      {
        id: 'rp_001', reportNo: 'BX20260531001', type: 'water_quality', title: '城东片区水质异常',
        description: '城东管网监测点A检测发现水质异常，pH值8.8，浊度3.5，余氯0.2，检出大肠菌群。请立即处理。',
        location: '城东区', address: '城东区人民路与建设路交叉口', contactName: '张工', contactPhone: '13800138001',
        affectedArea: '城东区人民路沿线小区', affectedPopulation: 15000, urgency: 'critical', status: 'assigned',
        reportedBy: 'user_001', reporterName: '张工', reporterRole: 'chemist', assignedTo: 'team_001', assigneeName: '管网抢修一队', waterStopNeeded: 1
      },
      {
        id: 'rp_002', reportNo: 'BX20260531002', type: 'pipe_leak', title: '阳光花园小区水管爆裂',
        description: '阳光花园小区3号楼前地下水管爆裂，大量漏水。',
        location: '城南区', address: '城南区阳光大道168号阳光花园小区', contactName: '业主李先生', contactPhone: '13900139001',
        affectedArea: '阳光花园小区3、4、5号楼', affectedPopulation: 1200, urgency: 'high', status: 'in_progress',
        reportedBy: 'user_005', reporterName: '陈客服', reporterRole: 'hotline', assignedTo: 'team_002', assigneeName: '管网抢修二队', waterStopNeeded: 1
      },
      {
        id: 'rp_003', reportNo: 'BX20260531003', type: 'pressure_low', title: '锦绣家园水压不足',
        description: '锦绣家园小区多个楼层反映水压不足，热水器无法正常使用。',
        location: '城北区', address: '城北区锦绣路256号锦绣家园', contactName: '业主王女士', contactPhone: '13900139002',
        affectedArea: '锦绣家园小区10-15号楼高层', affectedPopulation: 800, urgency: 'medium', status: 'pending',
        reportedBy: 'user_005', reporterName: '陈客服', reporterRole: 'hotline', waterStopNeeded: 0
      },
    ];
    reports.forEach(r => insertRepairReport.run(
      r.id, r.reportNo, r.type, r.title, r.description, r.location, r.address, r.contactName, r.contactPhone,
      r.affectedArea || null, r.affectedPopulation || null, r.urgency, r.status, r.reportedBy || null,
      r.reporterName || null, r.reporterRole || null, r.assignedTo || null, r.assigneeName || null,
      r.waterStopNeeded, now, now
    ));

    const orders = [
      {
        id: 'wo_001', orderNo: 'GD20260531001', repairReportId: 'rp_001', title: '城东片区水质异常应急处理',
        description: '对城东区管网进行冲洗消毒，排查污染源，确保水质达标。', location: '城东区',
        teamId: 'team_001', teamName: '管网抢修一队', teamMembers: '王队、赵刚、孙明', priority: 'critical',
        status: 'in_progress', estimatedStart: '2026-05-31 10:00', estimatedEnd: '2026-05-31 18:00'
      },
      {
        id: 'wo_002', orderNo: 'GD20260531002', repairReportId: 'rp_002', title: '阳光花园水管爆裂抢修',
        description: '更换爆裂水管，修复漏水点。', location: '城南区阳光花园小区',
        teamId: 'team_002', teamName: '管网抢修二队', teamMembers: '刘队、钱伟、周强', priority: 'high',
        status: 'in_progress', estimatedStart: '2026-05-31 09:30', estimatedEnd: '2026-05-31 15:00'
      },
    ];
    orders.forEach(o => insertWorkOrder.run(
      o.id, o.orderNo, o.repairReportId, o.title, o.description, o.location, o.teamId, o.teamName,
      o.teamMembers, o.priority, o.status, o.estimatedStart, o.estimatedEnd, now, now
    ));

    const notices = [
      {
        id: 'wsn_001', noticeNo: 'TS20260531001', title: '城东区临时停水通知',
        content: '因城东管网水质异常应急处理，需对城东区人民路沿线区域进行临时停水。预计停水时间10:00-18:00。请相关用户提前做好储水准备。',
        affectedArea: '城东区人民路沿线小区', affectedPopulation: 15000,
        startTime: '2026-05-31 10:00', endTime: '2026-05-31 18:00', reason: '水质异常应急处理',
        status: 'active', published: 1, createdBy: 'user_006'
      },
      {
        id: 'wsn_002', noticeNo: 'TS20260531002', title: '阳光花园小区停水通知',
        content: '因阳光花园小区水管爆裂抢修，需对3、4、5号楼进行临时停水。预计停水时间09:30-15:00。',
        affectedArea: '阳光花园小区3、4、5号楼', affectedPopulation: 1200,
        startTime: '2026-05-31 09:30', endTime: '2026-05-31 15:00', reason: '水管爆裂抢修',
        status: 'active', published: 1, createdBy: 'user_006'
      },
    ];
    notices.forEach(n => insertWaterStopNotice.run(
      n.id, n.noticeNo, n.title, n.content, n.affectedArea, n.affectedPopulation || null,
      n.startTime, n.endTime, n.reason, n.status, n.published, n.createdBy, now, now
    ));

    const notifications = [
      { id: 'notif_001', type: 'quality', title: '水质异常警报', content: '城东管网监测点A检测发现水质异常，请立即关注。', targetRoles: 'chemist,admin', isRead: 0 },
      { id: 'notif_002', type: 'repair', title: '新报修单', content: '阳光花园小区报告水管爆裂，已派单给管网抢修二队。', targetRoles: 'repair_crew,admin', isRead: 0 },
      { id: 'notif_003', type: 'water_stop', title: '停水公告发布', content: '城东区临时停水通知已发布。', targetRoles: 'hotline,admin', isRead: 1 },
    ];
    notifications.forEach(n => insertNotification.run(n.id, n.type, n.title, n.content, n.targetRoles, n.isRead, now));

    insertRecheckRecord.run(
      'rc_001', 'wq_003', '2026-05-31 14:00', 8.2, 2.1, 0.4, 8, 'fail', 'user_001', '张工',
      '冲洗消毒后复测，部分指标仍超标，继续处理。', now
    );
  });

  transaction();
  console.log('Sample data seeded successfully!');
}

seedData();
