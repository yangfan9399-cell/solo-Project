import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.post('/:isbn', (req: Request, res: Response): void => {
  try {
    const isbn = req.params.isbn

    const holdings = db.prepare(`
      SELECT h.*, p.name as library_name, p.code as library_code, p.contact_person, p.contact_phone, p.status as library_status
      FROM library_holdings h
      JOIN partner_libraries p ON h.library_id = p.id
      WHERE h.isbn = ? AND p.status = 'active'
      ORDER BY h.available DESC, p.cooperation_level DESC
    `).all(isbn)

    res.json({ success: true, data: holdings })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
