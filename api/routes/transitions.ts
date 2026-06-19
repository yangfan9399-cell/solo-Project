import { Router, type Request, type Response } from 'express'
import * as store from '../store.js'

const router = Router()

router.get('/:anomalyId', (req: Request, res: Response) => {
  const data = store.getTransitions(req.params.anomalyId)
  res.json({ success: true, data })
})

export default router
