import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import type { RequestStatus, CreateRequestInput, CreateShippingInput, CreateRenewalInput } from '../../shared/types.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { status, libraryId, readerName, startDate, endDate } = req.query
    let sql = `
      SELECT r.*, p.name as library_name, p.code as library_code
      FROM interlibrary_requests r
      LEFT JOIN partner_libraries p ON r.library_id = p.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (status) {
      sql += ' AND r.status = ?'
      params.push(status)
    }
    if (libraryId) {
      sql += ' AND r.library_id = ?'
      params.push(libraryId)
    }
    if (readerName) {
      sql += ' AND r.reader_name LIKE ?'
      params.push(`%${readerName}%`)
    }
    if (startDate) {
      sql += ' AND r.created_at >= ?'
      params.push(startDate)
    }
    if (endDate) {
      sql += ' AND r.created_at <= ?'
      params.push(endDate)
    }

    sql += ' ORDER BY r.created_at DESC'

    const rows = db.prepare(sql).all(...params)
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const request = db.prepare(`
      SELECT r.*, p.name as library_name, p.code as library_code,
             p.contact_person, p.contact_phone, p.contact_email
      FROM interlibrary_requests r
      LEFT JOIN partner_libraries p ON r.library_id = p.id
      WHERE r.id = ?
    `).get(id) as Record<string, unknown> | undefined

    if (!request) {
      res.status(404).json({ success: false, error: '申请不存在' })
      return
    }

    const shippingRecords = db.prepare(
      'SELECT * FROM shipping_records WHERE request_id = ? ORDER BY created_at DESC'
    ).all(id)

    const renewalRequests = db.prepare(
      'SELECT * FROM renewal_requests WHERE request_id = ? ORDER BY created_at DESC'
    ).all(id)

    const exceptionRecords = db.prepare(
      'SELECT * FROM exception_records WHERE request_id = ? ORDER BY created_at DESC'
    ).all(id)

    res.json({
      success: true,
      data: { ...request, shipping_records: shippingRecords, renewal_requests: renewalRequests, exception_records: exceptionRecords },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const input: CreateRequestInput = req.body
    const userId = 1
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined
    const operatorName = user?.name || '系统'

    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    const prefix = `ILL-${dateStr}-`

    const existing = db.prepare(
      "SELECT request_no FROM interlibrary_requests WHERE request_no LIKE ? ORDER BY request_no DESC LIMIT 1"
    ).get(`${prefix}%`) as { request_no: string } | undefined

    let seq = 1
    if (existing) {
      const lastSeq = parseInt(existing.request_no.split('-').pop() || '0', 10)
      seq = lastSeq + 1
    }

    const requestNo = `${prefix}${String(seq).padStart(3, '0')}`

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const result = db.prepare(`
      INSERT INTO interlibrary_requests (request_no, isbn, title, author, publisher, reader_name, reader_phone, reader_email, library_id, status, request_type, purpose, due_date, notes, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      requestNo, input.isbn, input.title, input.author, input.publisher,
      input.reader_name, input.reader_phone, input.reader_email, input.library_id,
      input.request_type || 'borrow', input.purpose, input.due_date || null,
      input.notes || '', userId, now, now
    )

    db.prepare(`
      INSERT INTO status_transitions (request_id, from_status, to_status, operated_by, operator_name, remark, created_at)
      VALUES (?, NULL, 'pending', ?, ?, '提交互借申请', ?)
    `).run(result.lastInsertRowid, userId, operatorName, now)

    const newRequest = db.prepare('SELECT * FROM interlibrary_requests WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: newRequest })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.put('/:id/status', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const { toStatus, remark } = req.body as { toStatus: RequestStatus; remark?: string }
    const userId = 1
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined
    const operatorName = user?.name || '系统'

    const request = db.prepare('SELECT status FROM interlibrary_requests WHERE id = ?').get(id) as { status: RequestStatus } | undefined
    if (!request) {
      res.status(404).json({ success: false, error: '申请不存在' })
      return
    }

    const fromStatus = request.status
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    db.prepare('UPDATE interlibrary_requests SET status = ?, updated_at = ? WHERE id = ?').run(toStatus, now, id)

    db.prepare(`
      INSERT INTO status_transitions (request_id, from_status, to_status, operated_by, operator_name, remark, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, fromStatus, toStatus, userId, operatorName, remark || '', now)

    const updated = db.prepare('SELECT * FROM interlibrary_requests WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/:id/transitions', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const transitions = db.prepare(
      'SELECT * FROM status_transitions WHERE request_id = ? ORDER BY created_at ASC'
    ).all(id)
    res.json({ success: true, data: transitions })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/:id/renewal', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const input: CreateRenewalInput = req.body
    const userId = 1
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined
    const operatorName = user?.name || '系统'

    const request = db.prepare('SELECT * FROM interlibrary_requests WHERE id = ?').get(id) as { status: RequestStatus; due_date: string | null } | undefined
    if (!request) {
      res.status(404).json({ success: false, error: '申请不存在' })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const originalDueDate = request.due_date || now

    db.prepare(`
      INSERT INTO renewal_requests (request_id, original_due_date, requested_due_date, reason, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(id, originalDueDate, input.requested_due_date, input.reason, now)

    const fromStatus = request.status
    db.prepare('UPDATE interlibrary_requests SET status = ?, updated_at = ? WHERE id = ?').run('renewal_pending', now, id)

    db.prepare(`
      INSERT INTO status_transitions (request_id, from_status, to_status, operated_by, operator_name, remark, created_at)
      VALUES (?, ?, 'renewal_pending', ?, ?, ?, ?)
    `).run(id, fromStatus, userId, operatorName, `申请续借至${input.requested_due_date}`, now)

    res.status(201).json({ success: true, data: { message: '续借申请已提交' } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.put('/:id/ship', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const input: CreateShippingInput = req.body
    const userId = 1
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined
    const operatorName = user?.name || '系统'

    const request = db.prepare('SELECT status FROM interlibrary_requests WHERE id = ?').get(id) as { status: RequestStatus } | undefined
    if (!request) {
      res.status(404).json({ success: false, error: '申请不存在' })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    db.prepare(`
      INSERT INTO shipping_records (request_id, carrier, tracking_number, shipped_date, estimated_arrival, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, input.carrier, input.tracking_number, input.shipped_date || now, input.estimated_arrival || null, input.notes || '', now)

    const fromStatus = request.status
    db.prepare('UPDATE interlibrary_requests SET status = ?, updated_at = ? WHERE id = ?').run('shipping_out', now, id)

    db.prepare(`
      INSERT INTO status_transitions (request_id, from_status, to_status, operated_by, operator_name, remark, created_at)
      VALUES (?, ?, 'shipping_out', ?, ?, ?, ?)
    `).run(id, fromStatus, userId, operatorName, `物流单号: ${input.tracking_number}`, now)

    res.json({ success: true, data: { message: '物流信息已登记' } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.put('/:id/arrive', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const userId = 1
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined
    const operatorName = user?.name || '系统'

    const request = db.prepare('SELECT status FROM interlibrary_requests WHERE id = ?').get(id) as { status: RequestStatus } | undefined
    if (!request) {
      res.status(404).json({ success: false, error: '申请不存在' })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    db.prepare('UPDATE shipping_records SET actual_arrival = ? WHERE request_id = ? AND actual_arrival IS NULL').run(now, id)

    const fromStatus = request.status
    db.prepare('UPDATE interlibrary_requests SET status = ?, updated_at = ? WHERE id = ?').run('arrived', now, id)

    db.prepare(`
      INSERT INTO status_transitions (request_id, from_status, to_status, operated_by, operator_name, remark, created_at)
      VALUES (?, ?, 'arrived', ?, ?, '图书已到馆', ?)
    `).run(id, fromStatus, userId, operatorName, now)

    res.json({ success: true, data: { message: '已确认到馆' } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.put('/:id/renewal/:renewalId', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const renewalId = Number(req.params.renewalId)
    const { approved, remark } = req.body as { approved: boolean; remark?: string }
    const userId = 1
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined
    const operatorName = user?.name || '系统'

    const request = db.prepare('SELECT * FROM interlibrary_requests WHERE id = ?').get(id) as { status: RequestStatus; due_date: string | null } | undefined
    if (!request) {
      res.status(404).json({ success: false, error: '申请不存在' })
      return
    }

    const renewal = db.prepare('SELECT * FROM renewal_requests WHERE id = ? AND request_id = ?').get(renewalId, id) as { requested_due_date: string; status: string } | undefined
    if (!renewal) {
      res.status(404).json({ success: false, error: '续借申请不存在' })
      return
    }

    if (renewal.status !== 'pending') {
      res.status(400).json({ success: false, error: '续借申请已处理' })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const renewalStatus = approved ? 'approved' : 'rejected'
    const newRequestStatus = approved ? 'renewal_approved' : 'renewal_rejected'

    db.prepare(`
      UPDATE renewal_requests
      SET status = ?, reviewed_by = ?, reviewed_at = ?
      WHERE id = ?
    `).run(renewalStatus, userId, now, renewalId)

    let newDueDate = request.due_date
    if (approved) {
      newDueDate = renewal.requested_due_date
      db.prepare('UPDATE interlibrary_requests SET status = ?, due_date = ?, updated_at = ? WHERE id = ?').run(newRequestStatus, newDueDate, now, id)
    } else {
      db.prepare('UPDATE interlibrary_requests SET status = ?, updated_at = ? WHERE id = ?').run(newRequestStatus, now, id)
    }

    db.prepare(`
      INSERT INTO status_transitions (request_id, from_status, to_status, operated_by, operator_name, remark, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, request.status, newRequestStatus, userId, operatorName, remark || (approved ? `续借批准，到期日更新为${newDueDate}` : '续借拒绝'), now)

    const updated = db.prepare('SELECT * FROM interlibrary_requests WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.put('/:id/return', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const { returnTrackingNumber } = req.body as { returnTrackingNumber?: string }
    const userId = 1
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined
    const operatorName = user?.name || '系统'

    const request = db.prepare('SELECT status FROM interlibrary_requests WHERE id = ?').get(id) as { status: RequestStatus } | undefined
    if (!request) {
      res.status(404).json({ success: false, error: '申请不存在' })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    if (returnTrackingNumber) {
      db.prepare('UPDATE shipping_records SET return_tracking_number = ?, return_shipped_date = ? WHERE request_id = ?').run(returnTrackingNumber, now, id)
    }

    const fromStatus = request.status
    db.prepare('UPDATE interlibrary_requests SET status = ?, updated_at = ? WHERE id = ?').run('returning', now, id)

    db.prepare(`
      INSERT INTO status_transitions (request_id, from_status, to_status, operated_by, operator_name, remark, created_at)
      VALUES (?, ?, 'returning', ?, ?, ?, ?)
    `).run(id, fromStatus, userId, operatorName, returnTrackingNumber ? `归还物流单号: ${returnTrackingNumber}` : '归还验收', now)

    res.json({ success: true, data: { message: '归还已登记' } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.put('/:id/complete', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const { remark } = req.body as { remark?: string }
    const userId = 1
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined
    const operatorName = user?.name || '系统'

    const request = db.prepare('SELECT status FROM interlibrary_requests WHERE id = ?').get(id) as { status: RequestStatus } | undefined
    if (!request) {
      res.status(404).json({ success: false, error: '申请不存在' })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const fromStatus = request.status

    db.prepare('UPDATE interlibrary_requests SET status = ?, actual_return_date = ?, updated_at = ? WHERE id = ?').run('completed', now, now, id)

    db.prepare(`
      INSERT INTO status_transitions (request_id, from_status, to_status, operated_by, operator_name, remark, created_at)
      VALUES (?, ?, 'completed', ?, ?, ?, ?)
    `).run(id, fromStatus, userId, operatorName, remark || '归还验收完成', now)

    const updated = db.prepare('SELECT * FROM interlibrary_requests WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
