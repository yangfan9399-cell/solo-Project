import db, { initDatabase } from './db.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

initDatabase()

const users = [
  { name: '张客服', role: 'customer_service', phone: '13800000001' },
  { name: '李班长', role: 'team_leader', phone: '13800000002' },
  { name: '王经理', role: 'manager', phone: '13800000003' },
  { name: '陈维修', role: 'technician', phone: '13800000004' },
  { name: '刘维修', role: 'technician', phone: '13800000005' },
  { name: '赵维修', role: 'technician', phone: '13800000006' },
]

const categories = [
  { name: '水电维修', description: '水管、电路相关问题', sort_order: 1 },
  { name: '门窗维修', description: '门、窗、锁具相关问题', sort_order: 2 },
  { name: '墙面地面', description: '墙面、地面、瓷砖相关问题', sort_order: 3 },
  { name: '家电维修', description: '家用电器维修', sort_order: 4 },
  { name: '公共区域', description: '公共设施、楼道、电梯等', sort_order: 5 },
  { name: '其他', description: '其他类型问题', sort_order: 6 },
]

const materials = [
  { name: 'PPR水管', unit: '米', unit_price: 15.5, stock: 100 },
  { name: '水龙头', unit: '个', unit_price: 85, stock: 50 },
  { name: '电线2.5平方', unit: '米', unit_price: 3.5, stock: 500 },
  { name: '开关面板', unit: '个', unit_price: 25, stock: 100 },
  { name: '灯泡', unit: '个', unit_price: 12, stock: 200 },
  { name: '门锁', unit: '套', unit_price: 180, stock: 30 },
  { name: '玻璃胶', unit: '支', unit_price: 18, stock: 80 },
  { name: '膨胀螺丝', unit: '个', unit_price: 2, stock: 500 },
]

const tickets = [
  {
    ticket_no: 'WX20240601001',
    title: '客厅空调漏水',
    description: '客厅壁挂式空调漏水，滴到地板上，需要紧急处理',
    category_id: 4,
    priority: 'high',
    status: 'completed',
    owner_name: '张先生',
    owner_phone: '13900001001',
    owner_address: '1号楼1单元101室',
    creator_id: 1,
    assignee_id: 4,
    estimated_hours: 2,
    actual_hours: 1.5,
    completed_at: '2024-06-01 11:30:00',
  },
  {
    ticket_no: 'WX20240601002',
    title: '厨房水龙头漏水',
    description: '厨房洗菜盆水龙头滴水，已经有一周时间',
    category_id: 1,
    priority: 'normal',
    status: 'in_progress',
    owner_name: '李女士',
    owner_phone: '13900001002',
    owner_address: '2号楼3单元502室',
    creator_id: 1,
    assignee_id: 5,
    estimated_hours: 1,
  },
  {
    ticket_no: 'WX20240601003',
    title: '卧室门锁坏了',
    description: '主卧门锁无法正常打开，钥匙插入后转不动',
    category_id: 2,
    priority: 'urgent',
    status: 'assigned',
    owner_name: '王先生',
    owner_phone: '13900001003',
    owner_address: '3号楼2单元301室',
    creator_id: 1,
    assignee_id: 4,
    estimated_hours: 1.5,
  },
  {
    ticket_no: 'WX20240601004',
    title: '客厅灯不亮',
    description: '客厅主灯突然不亮了，检查过灯泡没坏',
    category_id: 1,
    priority: 'normal',
    status: 'pending',
    owner_name: '赵女士',
    owner_phone: '13900001004',
    owner_address: '5号楼1单元803室',
    creator_id: 1,
    estimated_hours: 1,
  },
  {
    ticket_no: 'WX20240601005',
    title: '电梯故障',
    description: '2号楼电梯停运，显示故障代码E03',
    category_id: 5,
    priority: 'urgent',
    status: 'pending',
    owner_name: '物业中心',
    owner_phone: '4001234567',
    owner_address: '2号楼电梯间',
    creator_id: 3,
    estimated_hours: 4,
  },
  {
    ticket_no: 'WX20240601006',
    title: '墙面开裂',
    description: '主卧墙面有一条约1米长的裂缝',
    category_id: 3,
    priority: 'low',
    status: 'pending',
    owner_name: '孙先生',
    owner_phone: '13900001006',
    owner_address: '1号楼2单元1202室',
    creator_id: 1,
    estimated_hours: 3,
  },
]

const ticketMaterials = [
  { ticket_id: 1, material_id: 7, quantity: 2, unit_price: 18 },
  { ticket_id: 2, material_id: 2, quantity: 1, unit_price: 85 },
  { ticket_id: 2, material_id: 1, quantity: 0.5, unit_price: 15.5 },
]

const followUps = [
  {
    ticket_id: 1,
    operator_id: 1,
    satisfaction: 5,
    feedback: '维修师傅很专业，很快就修好，服务态度也很好',
    follow_up_date: '2024-06-02 10:00:00',
    status: 'completed',
  },
]

const escalationRecords = [
  {
    ticket_id: 5,
    level: 1,
    reason: '电梯停运影响业主出行，需立即处理',
    operator_id: 3,
  },
]

function seed() {
  console.log('开始插入示例数据...')

  const insertUser = db.prepare('INSERT INTO users (name, role, phone) VALUES (?, ?, ?)')
  users.forEach(u => insertUser.run(u.name, u.role, u.phone))
  console.log('✓ 插入用户数据')

  const insertCategory = db.prepare('INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)')
  categories.forEach(c => insertCategory.run(c.name, c.description, c.sort_order))
  console.log('✓ 插入故障分类数据')

  const insertMaterial = db.prepare('INSERT INTO materials (name, unit, unit_price, stock) VALUES (?, ?, ?, ?)')
  materials.forEach(m => insertMaterial.run(m.name, m.unit, m.unit_price, m.stock))
  console.log('✓ 插入材料数据')

  const insertTicket = db.prepare(`
    INSERT INTO tickets 
    (ticket_no, title, description, category_id, priority, status, owner_name, owner_phone, owner_address, creator_id, assignee_id, estimated_hours, actual_hours, completed_at, created_at, updated_at)
    VALUES 
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `)
  tickets.forEach(t => insertTicket.run(
    t.ticket_no, t.title, t.description, t.category_id, t.priority, t.status,
    t.owner_name, t.owner_phone, t.owner_address, t.creator_id, t.assignee_id,
    t.estimated_hours, t.actual_hours, t.completed_at
  ))
  console.log('✓ 插入报修单数据')

  const insertTicketMaterial = db.prepare('INSERT INTO ticket_materials (ticket_id, material_id, quantity, unit_price) VALUES (?, ?, ?, ?)')
  ticketMaterials.forEach(tm => insertTicketMaterial.run(tm.ticket_id, tm.material_id, tm.quantity, tm.unit_price))
  console.log('✓ 插入报修单材料数据')

  const insertFollowUp = db.prepare(`
    INSERT INTO follow_ups (ticket_id, operator_id, satisfaction, feedback, follow_up_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  followUps.forEach(f => insertFollowUp.run(f.ticket_id, f.operator_id, f.satisfaction, f.feedback, f.follow_up_date, f.status))
  console.log('✓ 插入回访记录数据')

  const insertEscalation = db.prepare('INSERT INTO escalation_records (ticket_id, level, reason, operator_id) VALUES (?, ?, ?, ?)')
  escalationRecords.forEach(e => insertEscalation.run(e.ticket_id, e.level, e.reason, e.operator_id))
  console.log('✓ 插入升级记录数据')

  console.log('\n示例数据插入完成！')
}

seed()
