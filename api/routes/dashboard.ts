import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/stats', (req: Request, res: Response): void => {
  try {
    const pendingCount = db.prepare("SELECT COUNT(*) as count FROM interlibrary_requests WHERE status = 'pending'").get() as { count: number }
    const inProgressCount = db.prepare("SELECT COUNT(*) as count FROM interlibrary_requests WHERE status IN ('approved', 'shipping_out', 'in_transit', 'arrived', 'reading', 'renewal_pending', 'renewal_approved', 'returning')").get() as { count: number }
    const overdueCount = db.prepare("SELECT COUNT(*) as count FROM interlibrary_requests WHERE status = 'overdue'").get() as { count: number }
    const completedThisMonth = db.prepare("SELECT COUNT(*) as count FROM interlibrary_requests WHERE status = 'completed' AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now', 'localtime')").get() as { count: number }
    const totalRequests = db.prepare('SELECT COUNT(*) as count FROM interlibrary_requests').get() as { count: number }
    const exceptionCount = db.prepare("SELECT COUNT(*) as count FROM exception_records WHERE status = 'open'").get() as { count: number }

    res.json({
      success: true,
      data: {
        pending_count: pendingCount.count,
        in_progress_count: inProgressCount.count,
        overdue_count: overdueCount.count,
        completed_this_month: completedThisMonth.count,
        total_requests: totalRequests.count,
        exception_count: exceptionCount.count,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/activities', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare(`
      SELECT st.id, st.request_id, r.request_no, st.from_status, st.to_status,
             st.operator_name, st.remark, st.created_at
      FROM status_transitions st
      LEFT JOIN interlibrary_requests r ON st.request_id = r.id
      ORDER BY st.created_at DESC
      LIMIT 20
    `).all()
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/todos', (req: Request, res: Response): void => {
  try {
    const todos: Array<{ id: number; request_id: number; type: string; title: string; description: string; request_no: string; priority: string; created_at: string }> = []

    const pendingRequests = db.prepare(`
      SELECT r.id, r.request_no, r.title, r.reader_name, r.created_at
      FROM interlibrary_requests r WHERE r.status = 'pending'
      ORDER BY r.created_at ASC
    `).all() as Array<{ id: number; request_no: string; title: string; reader_name: string; created_at: string }>

    for (const r of pendingRequests) {
      todos.push({
        id: r.id,
        request_id: r.id,
        type: 'pending_approval',
        title: '待审批申请',
        description: `${r.reader_name} 申请借阅《${r.title}》`,
        request_no: r.request_no,
        priority: 'high',
        created_at: r.created_at,
      })
    }

    const renewalPending = db.prepare(`
      SELECT r.id, r.request_no, r.title, r.reader_name, rn.requested_due_date, rn.created_at
      FROM interlibrary_requests r
      JOIN renewal_requests rn ON r.id = rn.request_id
      WHERE r.status = 'renewal_pending' AND rn.status = 'pending'
      ORDER BY rn.created_at ASC
    `).all() as Array<{ id: number; request_no: string; title: string; reader_name: string; requested_due_date: string; created_at: string }>

    for (const r of renewalPending) {
      todos.push({
        id: r.id,
        request_id: r.id,
        type: 'renewal_approval',
        title: '待审批续借',
        description: `${r.reader_name} 申请续借《${r.title}》至${r.requested_due_date}`,
        request_no: r.request_no,
        priority: 'medium',
        created_at: r.created_at,
      })
    }

    const overdueRecords = db.prepare(`
      SELECT o.id, o.request_id, r.request_no, r.title, r.reader_name, o.overdue_days, o.created_at
      FROM overdue_records o
      JOIN interlibrary_requests r ON o.request_id = r.id
      WHERE o.status = 'active'
      ORDER BY o.overdue_days DESC
    `).all() as Array<{ id: number; request_id: number; request_no: string; title: string; reader_name: string; overdue_days: number; created_at: string }>

    for (const r of overdueRecords) {
      todos.push({
        id: r.id,
        request_id: r.request_id,
        type: 'overdue_remind',
        title: '逾期催还',
        description: `${r.reader_name} 借阅《${r.title}》已逾期${r.overdue_days}天`,
        request_no: r.request_no,
        priority: 'high',
        created_at: r.created_at,
      })
    }

    const openExceptions = db.prepare(`
      SELECT e.id, e.request_id, r.request_no, r.title, e.type, e.description, e.created_at
      FROM exception_records e
      JOIN interlibrary_requests r ON e.request_id = r.id
      WHERE e.status = 'open'
      ORDER BY e.created_at ASC
    `).all() as Array<{ id: number; request_id: number; request_no: string; title: string; type: string; description: string; created_at: string }>

    for (const r of openExceptions) {
      todos.push({
        id: r.id,
        request_id: r.request_id,
        type: 'exception_handle',
        title: '异常处理',
        description: `《${r.title}》${r.type}: ${r.description}`,
        request_no: r.request_no,
        priority: 'high',
        created_at: r.created_at,
      })
    }

    const arrivedRequests = db.prepare(`
      SELECT r.id, r.request_no, r.title, r.reader_name, s.actual_arrival
      FROM interlibrary_requests r
      JOIN shipping_records s ON r.id = s.request_id
      WHERE r.status = 'arrived'
      ORDER BY s.actual_arrival ASC
    `).all() as Array<{ id: number; request_no: string; title: string; reader_name: string; actual_arrival: string }>

    for (const r of arrivedRequests) {
      todos.push({
        id: r.id,
        request_id: r.id,
        type: 'pickup_notify',
        title: '到馆通知',
        description: `《${r.title}》已到馆，通知${r.reader_name}取书`,
        request_no: r.request_no,
        priority: 'medium',
        created_at: r.actual_arrival,
      })
    }

    res.json({ success: true, data: todos })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
