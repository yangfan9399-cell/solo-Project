import { Router, type Request, type Response } from 'express'
import * as db from '../db.js'
import { computeImpact, type Thresholds } from '../thresholdEngine.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const published = db.getLatestPublishedRule()
  const draft = db.getDraftRule()

  if (!published || !draft) {
    res.json({ success: true, data: [] })
    return
  }

  const oldThresholds: Thresholds = JSON.parse(published.thresholds)
  const newThresholds: Thresholds = JSON.parse(draft.thresholds)
  const specimens = db.getSpecimens()

  const impact = computeImpact(specimens, oldThresholds, newThresholds)
  res.json({ success: true, data: impact })
})

router.get('/summary', (_req: Request, res: Response): void => {
  const published = db.getLatestPublishedRule()
  const draft = db.getDraftRule()

  if (!published || !draft) {
    res.json({ success: true, data: { toWarn: 0, toBlock: 0, warnToBlock: 0, total: 0 } })
    return
  }

  const oldThresholds: Thresholds = JSON.parse(published.thresholds)
  const newThresholds: Thresholds = JSON.parse(draft.thresholds)
  const specimens = db.getSpecimens()

  const impact = computeImpact(specimens, oldThresholds, newThresholds)

  const summary = {
    toWarn: impact.filter(i => i.newStatus === 'warn').length,
    toBlock: impact.filter(i => i.newStatus === 'block' && i.oldStatus === 'pass').length,
    warnToBlock: impact.filter(i => i.newStatus === 'block' && i.oldStatus === 'warn').length,
    total: impact.length,
  }

  res.json({ success: true, data: summary })
})

export default router
