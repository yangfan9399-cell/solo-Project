import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import type { CreateExceptionInput } from '../../shared/types.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare(`
      SELECT e.*, r.request_no, r.title, r.reader_name, r.isbn,
             p.name as library_name
      FROM exception_records e
      LEFT JOIN interlibrary_requests r ON e.request_id = r.id
      LEFT JOIN partner_libraries p ON r.library_id = p.id
      ORDER BY e.created_at DESC
    `).all()
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { request_id, type, description } = req.body as CreateExceptionInput & { request_id: number }
    const userId = 1
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined

    const request = db.prepare('SELECT id, status FROM interlibrary_requests WHERE id = ?').get(request_id)
    if (!request) {
      res.status(404).json({ success: false, error: '申请不存在' })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    db.prepare(`
      INSERT INTO exception_records (request_id, type, description, handler_id, handler_name, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'open', ?, ?)
    `).run(request_id, type, description, userId, user?.name || null, now, now)

    res.status(201).json({ success: true, data: { message: '异常记录已创建' } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const { status, resolution } = req.body as { status: string; resolution?: string }
    const userId = 1
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined

    const existing = db.prepare('SELECT * FROM exception_records WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: '异常记录不存在' })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    if (status === 'resolved' && resolution) {
      db.prepare(`
        UPDATE exception_records SET status = ?, resolution = ?, handler_id = ?, handler_name = ?, updated_at = ? WHERE id = ?
      `).run(status, resolution, userId, user?.name || null, now, id)
    } else {
      db.prepare(`
        UPDATE exception_records SET status = ?, updated_at = ? WHERE id = ?
      `).run(status, now, id)
    }

    const updated = db.prepare('SELECT * FROM exception_records WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
