import { Router, type Request, type Response } from 'express'
import * as store from '../store.js'

const router = Router()

router.post('/seed', (req: Request, res: Response) => {
  const result = store.seedData()
  res.json({ success: true, ...result })
})

export default router
