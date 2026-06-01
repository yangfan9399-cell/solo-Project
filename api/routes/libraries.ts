import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare('SELECT * FROM partner_libraries ORDER BY created_at DESC').all()
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const library = db.prepare('SELECT * FROM partner_libraries WHERE id = ?').get(id) as Record<string, unknown> | undefined

    if (!library) {
      res.status(404).json({ success: false, error: '合作馆不存在' })
      return
    }

    const holdings = db.prepare('SELECT * FROM library_holdings WHERE library_id = ? ORDER BY created_at DESC').all(id)
    const requestCount = db.prepare('SELECT COUNT(*) as count FROM interlibrary_requests WHERE library_id = ?').get(id) as { count: number }

    res.json({
      success: true,
      data: { ...library, holdings, request_count: requestCount.count },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, code, contact_person, contact_phone, contact_email, address, province, city, cooperation_level } = req.body

    const result = db.prepare(`
      INSERT INTO partner_libraries (name, code, contact_person, contact_phone, contact_email, address, province, city, cooperation_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, code, contact_person, contact_phone, contact_email, address, province, city, cooperation_level || 'normal')

    const newLibrary = db.prepare('SELECT * FROM partner_libraries WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: newLibrary })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const { name, code, contact_person, contact_phone, contact_email, address, province, city, cooperation_level, status } = req.body

    const existing = db.prepare('SELECT id FROM partner_libraries WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: '合作馆不存在' })
      return
    }

    db.prepare(`
      UPDATE partner_libraries SET name = ?, code = ?, contact_person = ?, contact_phone = ?, contact_email = ?, address = ?, province = ?, city = ?, cooperation_level = ?, status = ?
      WHERE id = ?
    `).run(name, code, contact_person, contact_phone, contact_email, address, province, city, cooperation_level, status, id)

    const updated = db.prepare('SELECT * FROM partner_libraries WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
