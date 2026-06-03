import bcrypt from 'bcryptjs';
import { initDatabase, run } from './db.js';

await initDatabase();

const hashPassword = (password: string) => bcrypt.hashSync(password, 10);

async function seedData() {
  const users = [
    { username: 'admin', password: hashPassword('admin123'), name: '系统管理员', email: 'admin@example.com', role: 'admin', department: '技术部', phone: '13800000001', status: 'active' },
    { username: 'producer1', password: hashPassword('prod123'), name: '张制片', email: 'zhang@example.com', role: 'producer', department: '节目部', phone: '13800000002', status: 'active' },
    { username: 'reporter1', password: hashPassword('rep123'), name: '李记者', email: 'li@example.com', role: 'reporter', department: '时政部', phone: '13800000003', status: 'active' },
    { username: 'reporter2', password: hashPassword('rep456'), name: '王记者', email: 'wang@example.com', role: 'reporter', department: '社会部', phone: '13800000004', status: 'active' },
    { username: 'admin2', password: hashPassword('admin456'), name: '刘管理员', email: 'liu@example.com', role: 'admin', department: '技术部', phone: '13800000005', status: 'active' },
  ];

  const userSql = `
    INSERT OR IGNORE INTO users (username, password, name, email, role, department, phone, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  for (const user of users) {
    await run(userSql, [user.username, user.password, user.name, user.email, user.role, user.department, user.phone, user.status]);
  }

  const equipments = [
    { name: '索尼FX3摄像机', code: 'CAM-001', category: '摄像机', brand: '索尼', model: 'FX3', serial_number: 'SN-2024-0001', purchase_date: '2024-01-15', purchase_price: 0, stock_quantity: 1, status: 'available', location: 'A栋3楼设备库', specification: '全画幅电影机，支持4K 120fps', description: '', accessories: '电池×2，充电器×1，SD卡×2，存储卡盒×1' },
    { name: '佳能C70摄像机', code: 'CAM-002', category: '摄像机', brand: '佳能', model: 'C70', serial_number: 'SN-2024-0002', purchase_date: '2024-02-20', purchase_price: 0, stock_quantity: 1, status: 'available', location: 'A栋3楼设备库', specification: 'RF卡口，Super 35mm传感器', description: '', accessories: '电池×2，充电器×1，肩带×1' },
    { name: '大疆Mavic 3无人机', code: 'DRN-001', category: '无人机', brand: '大疆', model: 'Mavic 3 Pro', serial_number: 'SN-2024-0003', purchase_date: '2024-03-10', purchase_price: 0, stock_quantity: 1, status: 'available', location: 'B栋1楼无人机库', specification: '4/3 CMOS哈苏相机，续航43分钟', description: '', accessories: '遥控器×1，电池×3，充电管家×1，桨叶×4对' },
    { name: 'DJI Ronin-S稳定器', code: 'STB-001', category: '稳定器', brand: '大疆', model: 'Ronin-S', serial_number: 'SN-2024-0004', purchase_date: '2024-01-20', purchase_price: 0, stock_quantity: 1, status: 'available', location: 'A栋3楼设备库', specification: '承重3.6kg，3轴稳定', description: '', accessories: '快装板×2，控制线×3' },
    { name: '罗德Wireless GO II麦克风', code: 'MIC-001', category: '麦克风', brand: '罗德', model: 'Wireless GO II', serial_number: 'SN-2024-0005', purchase_date: '2024-02-01', purchase_price: 0, stock_quantity: 1, status: 'available', location: 'A栋3楼设备库', specification: '双通道无线麦克风，续航7小时', description: '', accessories: '发射器×2，接收器×1，充电盒×1' },
    { name: '神牛AD600Pro闪光灯', code: 'LGT-001', category: '灯光设备', brand: '神牛', model: 'AD600Pro', serial_number: 'SN-2024-0006', purchase_date: '2024-03-01', purchase_price: 0, stock_quantity: 1, status: 'available', location: 'A栋3楼设备库', specification: '600Ws，TTL高速同步', description: '', accessories: '灯头×1，电池×2，充电器×1，灯罩×1' },
    { name: '索尼A7S III相机', code: 'CAM-003', category: '相机', brand: '索尼', model: 'A7S III', serial_number: 'SN-2024-0007', purchase_date: '2024-04-01', purchase_price: 0, stock_quantity: 1, status: 'maintenance', location: '维修中', specification: '全画幅微单，1210万像素', description: '', accessories: '电池×2，充电器×1' },
    { name: '三脚架曼富图MT055', code: 'TRP-001', category: '脚架', brand: '曼富图', model: 'MT055CXPRO3', serial_number: 'SN-2024-0008', purchase_date: '2024-01-10', purchase_price: 0, stock_quantity: 1, status: 'available', location: 'A栋3楼设备库', specification: '碳纤维三脚架，承重9kg', description: '', accessories: '云台×1，便携包×1' },
  ];

  const equipSql = `
    INSERT OR IGNORE INTO equipments (name, code, category, brand, model, serial_number, purchase_date, purchase_price, stock_quantity, status, location, specification, description, accessories)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  for (const eq of equipments) {
    await run(equipSql, [eq.name, eq.code, eq.category, eq.brand, eq.model, eq.serial_number, eq.purchase_date, eq.purchase_price, eq.stock_quantity, eq.status, eq.location, eq.specification, eq.description, eq.accessories]);
  }

  const tasks = [
    { task_no: 'TASK-2026-001', title: '市两会开幕式报道', description: '报道市十四届人大五次会议开幕式', reporter_id: 3, reporter_name: '李记者', shooting_location: '市人民大会堂', shooting_start_time: '2026-06-05 08:00:00', shooting_end_time: '2026-06-05 12:00:00', priority: 'urgent', status: 'approved', producer_id: 2, producer_name: '张制片', approved_at: '2026-06-03 10:00:00' },
    { task_no: 'TASK-2026-002', title: '重点项目建设调研', description: '采访高新区重点项目建设进展', reporter_id: 4, reporter_name: '王记者', shooting_location: '高新区产业园', shooting_start_time: '2026-06-06 09:00:00', shooting_end_time: '2026-06-06 18:00:00', priority: 'high', status: 'pending', producer_id: null, producer_name: null },
    { task_no: 'TASK-2026-003', title: '端午节民俗活动', description: '拍摄端午节龙舟比赛和民俗活动', reporter_id: 3, reporter_name: '李记者', shooting_location: '滨江公园', shooting_start_time: '2026-06-10 07:00:00', shooting_end_time: '2026-06-10 15:00:00', priority: 'medium', status: 'draft' },
  ];

  const taskSql = `
    INSERT OR IGNORE INTO shooting_tasks (task_no, title, description, reporter_id, reporter_name, shooting_location, shooting_start_time, shooting_end_time, priority, status, producer_id, producer_name, approved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  for (const task of tasks) {
    await run(taskSql, [task.task_no, task.title, task.description, task.reporter_id, task.reporter_name, task.shooting_location, task.shooting_start_time, task.shooting_end_time, task.priority, task.status, task.producer_id, task.producer_name, task.approved_at]);
  }

  const reservations = [
    { reservation_no: 'RES-2026-001', task_id: 1, equipment_id: 1, equipment_name: '索尼FX3摄像机', requester_id: 3, requester_name: '李记者', expected_pickup_time: '2026-06-05 07:00:00', expected_return_time: '2026-06-05 14:00:00', actual_pickup_time: null, actual_return_time: null, status: 'approved', approver_id: 2, approver_name: '张制片', approved_at: '2026-06-03 10:30:00', purpose: '市两会开幕式拍摄' },
    { reservation_no: 'RES-2026-002', task_id: 1, equipment_id: 5, equipment_name: '罗德Wireless GO II麦克风', requester_id: 3, requester_name: '李记者', expected_pickup_time: '2026-06-05 07:00:00', expected_return_time: '2026-06-05 14:00:00', actual_pickup_time: null, actual_return_time: null, status: 'approved', approver_id: 2, approver_name: '张制片', approved_at: '2026-06-03 10:30:00', purpose: '市两会开幕式同期声' },
    { reservation_no: 'RES-2026-003', task_id: 2, equipment_id: 2, equipment_name: '佳能C70摄像机', requester_id: 4, requester_name: '王记者', expected_pickup_time: '2026-06-06 08:00:00', expected_return_time: '2026-06-06 20:00:00', actual_pickup_time: null, actual_return_time: null, status: 'pending', approver_id: null, approver_name: null, approved_at: null, purpose: '高新区项目调研拍摄' },
  ];

  const resSql = `
    INSERT OR IGNORE INTO reservations (reservation_no, task_id, equipment_id, equipment_name, requester_id, requester_name, expected_pickup_time, expected_return_time, actual_pickup_time, actual_return_time, status, approver_id, approver_name, approved_at, purpose)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  for (const res of reservations) {
    await run(resSql, [res.reservation_no, res.task_id, res.equipment_id, res.equipment_name, res.requester_id, res.requester_name, res.expected_pickup_time, res.expected_return_time, res.actual_pickup_time, res.actual_return_time, res.status, res.approver_id, res.approver_name, res.approved_at, res.purpose]);
  }

  const mediaCards = [
    { code: 'SD-001', type: 'SD卡', capacity: '128GB', equipment_id: null, equipment_name: null, status: 'available', current_user_id: null, current_user_name: null, borrow_time: null, expected_return_time: null },
    { code: 'SD-002', type: 'SD卡', capacity: '256GB', equipment_id: null, equipment_name: null, status: 'available', current_user_id: null, current_user_name: null, borrow_time: null, expected_return_time: null },
    { code: 'SD-003', type: 'SD卡', capacity: '128GB', equipment_id: 1, equipment_name: '索尼FX3摄像机', status: 'in_use', current_user_id: 3, current_user_name: '李记者', borrow_time: '2026-06-03 09:00:00', expected_return_time: '2026-06-04 18:00:00' },
    { code: 'CF-001', type: 'CFexpress卡', capacity: '512GB', equipment_id: null, equipment_name: null, status: 'available', current_user_id: null, current_user_name: null, borrow_time: null, expected_return_time: null },
  ];

  const cardSql = `
    INSERT OR IGNORE INTO media_cards (code, type, capacity, equipment_id, equipment_name, status, current_user_id, current_user_name, borrow_time, expected_return_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  for (const card of mediaCards) {
    await run(cardSql, [card.code, card.type, card.capacity, card.equipment_id, card.equipment_name, card.status, card.current_user_id, card.current_user_name, card.borrow_time, card.expected_return_time]);
  }

  const damageReports = [
    { report_no: 'DMG-2026-001', equipment_id: 7, equipment_name: '索尼A7S III相机', reporter_id: 4, reporter_name: '王记者', damage_type: 'moderate', description: '相机卡口接触不良，镜头无法锁定', occurred_time: '2026-06-02 16:00:00', location: '采访现场', status: 'repairing', handler_id: 1, handler_name: '系统管理员' },
  ];

  const dmgSql = `
    INSERT OR IGNORE INTO damage_reports (report_no, equipment_id, equipment_name, reporter_id, reporter_name, damage_type, description, occurred_time, location, status, handler_id, handler_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  for (const dmg of damageReports) {
    await run(dmgSql, [dmg.report_no, dmg.equipment_id, dmg.equipment_name, dmg.reporter_id, dmg.reporter_name, dmg.damage_type, dmg.description, dmg.occurred_time, dmg.location, dmg.status, dmg.handler_id, dmg.handler_name]);
  }

  const overdueReminders = [
    { type: 'media_card', related_id: 3, related_no: 'SD-003', equipment_name: 'SD卡(128GB)', user_id: 3, user_name: '李记者', due_time: '2026-06-04 18:00:00', overdue_days: 0, status: 'pending' },
  ];

  const odSql = `
    INSERT OR IGNORE INTO overdue_reminders (type, related_id, related_no, equipment_name, user_id, user_name, due_time, overdue_days, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  for (const od of overdueReminders) {
    await run(odSql, [od.type, od.related_id, od.related_no, od.equipment_name, od.user_id, od.user_name, od.due_time, od.overdue_days, od.status]);
  }

  console.log('Seed data inserted successfully');
}

await seedData();
