import Fastify from 'fastify'
import cors from '@fastify/cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import db, { initDatabase } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

initDatabase()

const fastify = Fastify({ logger: true })

fastify.register(cors, { origin: true })

function generateTicketNo() {
  const date = new Date()
  const prefix = 'WX' + date.getFullYear() + 
    String(date.getMonth() + 1).padStart(2, '0') + 
    String(date.getDate()).padStart(2, '0')
  
  const lastTicket = db.prepare(`
    SELECT ticket_no FROM tickets WHERE ticket_no LIKE ? ORDER BY id DESC LIMIT 1
  `).get(prefix + '%')
  
  if (lastTicket) {
    const num = parseInt(lastTicket.ticket_no.slice(-3)) + 1
    return prefix + String(num).padStart(3, '0')
  }
  return prefix + '001'
}

fastify.get('/api/health', async () => ({ status: 'ok' }))

fastify.get('/api/users', async () => {
  const users = db.prepare('SELECT * FROM users ORDER BY role, name').all()
  return { data: users }
})

fastify.get('/api/users/technicians', async () => {
  const users = db.prepare("SELECT * FROM users WHERE role = 'technician' ORDER BY name").all()
  return { data: users }
})

fastify.get('/api/categories', async () => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order, id').all()
  return { data: categories }
})

fastify.post('/api/categories', async (request, reply) => {
  const { name, description, sort_order } = request.body
  const result = db.prepare('INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)').run(name, description, sort_order || 0)
  return { data: { id: result.lastInsertRowid, name, description, sort_order } }
})

fastify.get('/api/materials', async () => {
  const materials = db.prepare('SELECT * FROM materials ORDER BY name').all()
  return { data: materials }
})

fastify.get('/api/tickets', async (request) => {
  const { status, priority, assignee_id, category_id, search } = request.query
  
  let sql = `
    SELECT t.*, c.name as category_name, 
           creator.name as creator_name, 
           assignee.name as assignee_name,
           assignee.phone as assignee_phone
    FROM tickets t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN users creator ON t.creator_id = creator.id
    LEFT JOIN users assignee ON t.assignee_id = assignee.id
    WHERE 1=1
  `
  const params = []
  
  if (status) {
    sql += " AND t.status = ?"
    params.push(status)
  }
  if (priority) {
    sql += " AND t.priority = ?"
    params.push(priority)
  }
  if (assignee_id) {
    sql += " AND t.assignee_id = ?"
    params.push(assignee_id)
  }
  if (category_id) {
    sql += " AND t.category_id = ?"
    params.push(category_id)
  }
  if (search) {
    sql += " AND (t.title LIKE ? OR t.ticket_no LIKE ? OR t.owner_name LIKE ?)"
    const searchTerm = `%${search}%`
    params.push(searchTerm, searchTerm, searchTerm)
  }
  
  sql += " ORDER BY CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 END, t.created_at DESC"
  
  const tickets = db.prepare(sql).all(...params)
  return { data: tickets }
})

fastify.get('/api/tickets/:id', async (request, reply) => {
  const { id } = request.params
  const ticket = db.prepare(`
    SELECT t.*, c.name as category_name, 
           creator.name as creator_name, 
           assignee.name as assignee_name,
           assignee.phone as assignee_phone
    FROM tickets t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN users creator ON t.creator_id = creator.id
    LEFT JOIN users assignee ON t.assignee_id = assignee.id
    WHERE t.id = ?
  `).get(id)
  
  if (!ticket) {
    return reply.code(404).send({ error: 'Ticket not found' })
  }
  
  const logs = db.prepare(`
    SELECT tl.*, u.name as operator_name
    FROM ticket_logs tl
    LEFT JOIN users u ON tl.operator_id = u.id
    WHERE tl.ticket_id = ?
    ORDER BY tl.created_at DESC
  `).all(id)
  
  const materials = db.prepare(`
    SELECT tm.*, m.name as material_name, m.unit
    FROM ticket_materials tm
    LEFT JOIN materials m ON tm.material_id = m.id
    WHERE tm.ticket_id = ?
  `).all(id)
  
  const followUps = db.prepare(`
    SELECT fu.*, u.name as operator_name
    FROM follow_ups fu
    LEFT JOIN users u ON fu.operator_id = u.id
    WHERE fu.ticket_id = ?
    ORDER BY fu.created_at DESC
  `).all(id)
  
  const escalations = db.prepare(`
    SELECT er.*, u.name as operator_name
    FROM escalation_records er
    LEFT JOIN users u ON er.operator_id = u.id
    WHERE er.ticket_id = ?
    ORDER BY er.created_at DESC
  `).all(id)
  
  return { 
    data: { 
      ...ticket, 
      logs, 
      materials, 
      follow_ups: followUps,
      escalations
    } 
  }
})

fastify.post('/api/tickets', async (request) => {
  const { 
    title, description, category_id, priority,
    owner_name, owner_phone, owner_address,
    creator_id, assignee_id, estimated_hours
  } = request.body
  
  const ticket_no = generateTicketNo()
  const status = assignee_id ? 'assigned' : 'pending'
  
  const result = db.prepare(`
    INSERT INTO tickets 
    (ticket_no, title, description, category_id, priority, status,
     owner_name, owner_phone, owner_address, creator_id, assignee_id, estimated_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ticket_no, title, description, category_id, priority, status,
    owner_name, owner_phone, owner_address, creator_id, assignee_id, estimated_hours
  )
  
  db.prepare(`
    INSERT INTO ticket_logs (ticket_id, action, to_status, operator_id, remark)
    VALUES (?, ?, ?, ?, ?)
  `).run(result.lastInsertRowid, 'create', status, creator_id, '创建报修单')
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid)
  return { data: ticket }
})

fastify.put('/api/tickets/:id/assign', async (request, reply) => {
  const { id } = request.params
  const { assignee_id, operator_id } = request.body
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id)
  if (!ticket) {
    return reply.code(404).send({ error: 'Ticket not found' })
  }
  
  const newStatus = 'assigned'
  
  db.prepare(`
    UPDATE tickets SET assignee_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(assignee_id, newStatus, id)
  
  db.prepare(`
    INSERT INTO ticket_logs (ticket_id, action, from_status, to_status, operator_id, remark)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, 'assign', ticket.status, newStatus, operator_id, '分派维修人员')
  
  return { data: { success: true } }
})

fastify.put('/api/tickets/:id/accept', async (request, reply) => {
  const { id } = request.params
  const { operator_id } = request.body
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id)
  if (!ticket) {
    return reply.code(404).send({ error: 'Ticket not found' })
  }
  
  const newStatus = 'in_progress'
  
  db.prepare(`
    UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(newStatus, id)
  
  db.prepare(`
    INSERT INTO ticket_logs (ticket_id, action, from_status, to_status, operator_id, remark)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, 'accept', ticket.status, newStatus, operator_id, '接单开始维修')
  
  return { data: { success: true } }
})

fastify.put('/api/tickets/:id/complete', async (request, reply) => {
  const { id } = request.params
  const { actual_hours, materials, operator_id, remark } = request.body
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id)
  if (!ticket) {
    return reply.code(404).send({ error: 'Ticket not found' })
  }
  
  const newStatus = 'completed'
  
  db.prepare(`
    UPDATE tickets SET status = ?, actual_hours = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(newStatus, actual_hours, id)
  
  if (materials && materials.length > 0) {
    const insertMaterial = db.prepare(`
      INSERT INTO ticket_materials (ticket_id, material_id, quantity, unit_price)
      VALUES (?, ?, ?, ?)
    `)
    materials.forEach(m => {
      insertMaterial.run(id, m.material_id, m.quantity, m.unit_price)
    })
  }
  
  db.prepare(`
    INSERT INTO ticket_logs (ticket_id, action, from_status, to_status, operator_id, remark)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, 'complete', ticket.status, newStatus, operator_id, remark || '维修完成')
  
  return { data: { success: true } }
})

fastify.put('/api/tickets/:id/close', async (request, reply) => {
  const { id } = request.params
  const { operator_id, remark } = request.body
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id)
  if (!ticket) {
    return reply.code(404).send({ error: 'Ticket not found' })
  }
  
  const newStatus = 'closed'
  
  db.prepare(`
    UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(newStatus, id)
  
  db.prepare(`
    INSERT INTO ticket_logs (ticket_id, action, from_status, to_status, operator_id, remark)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, 'close', ticket.status, newStatus, operator_id, remark || '关闭报修单')
  
  return { data: { success: true } }
})

fastify.put('/api/tickets/:id/escalate', async (request, reply) => {
  const { id } = request.params
  const { level, reason, operator_id } = request.body
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id)
  if (!ticket) {
    return reply.code(404).send({ error: 'Ticket not found' })
  }
  
  db.prepare(`
    INSERT INTO escalation_records (ticket_id, level, reason, operator_id)
    VALUES (?, ?, ?, ?)
  `).run(id, level || 1, reason, operator_id)
  
  db.prepare(`
    INSERT INTO ticket_logs (ticket_id, action, operator_id, remark)
    VALUES (?, ?, ?, ?)
  `).run(id, 'escalate', operator_id, `升级到第${level || 1}级：${reason}`)
  
  return { data: { success: true } }
})

fastify.post('/api/tickets/:id/followup', async (request, reply) => {
  const { id } = request.params
  const { operator_id, satisfaction, feedback, follow_up_date, next_follow_up_date, status } = request.body
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id)
  if (!ticket) {
    return reply.code(404).send({ error: 'Ticket not found' })
  }
  
  const result = db.prepare(`
    INSERT INTO follow_ups (ticket_id, operator_id, satisfaction, feedback, follow_up_date, next_follow_up_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, operator_id, satisfaction, feedback, follow_up_date, next_follow_up_date, status || 'pending')
  
  db.prepare(`
    INSERT INTO ticket_logs (ticket_id, action, operator_id, remark)
    VALUES (?, ?, ?, ?)
  `).run(id, 'followup', operator_id, `质保回访：满意度${satisfaction}分`)
  
  return { data: { id: result.lastInsertRowid, success: true } }
})

fastify.get('/api/dashboard/stats', async () => {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
      SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent
    FROM tickets
  `).get()
  
  const today = new Date().toISOString().split('T')[0]
  const todayStats = db.prepare(`
    SELECT COUNT(*) as today_count
    FROM tickets
    WHERE DATE(created_at) = ?
  `).get(today)
  
  const byTechnician = db.prepare(`
    SELECT u.id, u.name, 
      COUNT(t.id) as total,
      SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
    FROM users u
    LEFT JOIN tickets t ON u.id = t.assignee_id
    WHERE u.role = 'technician'
    GROUP BY u.id, u.name
    ORDER BY total DESC
  `).all()
  
  return { 
    data: { 
      ...stats, 
      today: todayStats.today_count,
      by_technician: byTechnician 
    } 
  }
})

fastify.get('/api/followups/pending', async () => {
  const followUps = db.prepare(`
    SELECT fu.*, t.ticket_no, t.title, t.owner_name, t.owner_phone,
           u.name as operator_name
    FROM follow_ups fu
    LEFT JOIN tickets t ON fu.ticket_id = t.id
    LEFT JOIN users u ON fu.operator_id = u.id
    WHERE fu.status = 'pending'
    ORDER BY fu.created_at DESC
  `).all()
  
  return { data: followUps }
})

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' })
    console.log('Server running on http://localhost:3001')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
