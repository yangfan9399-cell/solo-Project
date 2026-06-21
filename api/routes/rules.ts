import { Router, type Request, type Response } from 'express'
import * as db from '../db.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const rules = db.getRules()
  const result = rules.map(r => ({
    ...r,
    thresholds: JSON.parse(r.thresholds),
  })).sort((a, b) => b.created_at.localeCompare(a.created_at))
  res.json({ success: true, data: result })
})

router.get('/:id', (req: Request, res: Response): void => {
  const rule = db.getRuleById(req.params.id)
  if (!rule) {
    res.status(404).json({ success: false, error: 'Rule not found' })
    return
  }
  res.json({ success: true, data: { ...rule, thresholds: JSON.parse(rule.thresholds) } })
})

router.post('/draft', (req: Request, res: Response): void => {
  const { thresholds, name } = req.body
  if (!thresholds) {
    res.status(400).json({ success: false, error: 'thresholds is required' })
    return
  }

  const updated = db.updateDraftRule(thresholds, name)
  res.json({ success: true, data: { ...updated, thresholds: JSON.parse(updated.thresholds) } })
})

export default router
