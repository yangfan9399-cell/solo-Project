import { Router, type Request, type Response } from 'express'
import * as db from '../db.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const specimens = db.getSpecimens()
  res.json({ success: true, data: specimens })
})

export default router
