import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare(`
      SELECT o.*, r.request_no, r.title, r.reader_name, r.isbn,
             p.name as library_name, p.code as library_code
      FROM overdue_records o
      LEFT JOIN interlibrary_requests r ON o.request_id = r.id
      LEFT JOIN partner_libraries p ON r.library_id = p.id
      ORDER BY o.created_at DESC
    `).all()
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/:id/remind', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)

    const overdue = db.prepare('SELECT * FROM overdue_records WHERE id = ?').get(id)
    if (!overdue) {
      res.status(404).json({ success: false, error: '逾期记录不存在' })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    db.prepare(`
      UPDATE overdue_records SET reminder_count = reminder_count + 1, last_reminder_date = ? WHERE id = ?
    `).run(now, id)

    const updated = db.prepare('SELECT * FROM overdue_records WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
