import { Router, type Request, type Response } from 'express'
import * as db from '../db.js'
import { type Thresholds } from '../thresholdEngine.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  try {
    const rules = db.getRules()
    const result = rules.map(r => {
      const thresholds: Thresholds = JSON.parse(r.thresholds)
      return { ...r, thresholds }
    }).sort((a, b) => b.created_at.localeCompare(a.created_at))
    res.json({ success: true, data: result })
  } catch (e) {
    console.error('[rules/list]', (e as Error).message)
    res.status(500).json({ success: false, error: (e as Error).message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const rule = db.getRuleById(req.params.id)
    if (!rule) {
      res.status(404).json({ success: false, error: 'Rule not found' })
      return
    }
    res.json({ success: true, data: { ...rule, thresholds: JSON.parse(rule.thresholds) } })
  } catch (e) {
    console.error('[rules/detail]', (e as Error).message)
    res.status(500).json({ success: false, error: (e as Error).message })
  }
})

router.post('/draft', (req: Request, res: Response): void => {
  try {
    const { thresholds, name } = req.body
    if (!thresholds) {
      res.status(400).json({ success: false, error: 'thresholds is required' })
      return
    }

    const requiredDims: (keyof Thresholds)[] = ['altitude', 'substrate', 'sporeDensity', 'humidityExposure']
    for (const d of requiredDims) {
      if (!thresholds[d] || typeof thresholds[d].passMax !== 'number' || typeof thresholds[d].warnMax !== 'number') {
        res.status(400).json({ success: false, error: `Thresholds missing valid ${d}.passMax / warnMax` })
        return
      }
      if (thresholds[d].warnMax <= thresholds[d].passMax) {
        res.status(400).json({ success: false, error: `${d}.warnMax must be greater than passMax` })
        return
      }
    }

    const published = db.getLatestPublishedRule()
    const pubThresholds: Thresholds | null = published ? JSON.parse(published.thresholds) : null
    const diff = pubThresholds ? db.computeThresholdDiff(pubThresholds, thresholds) : null

    if (diff && diff.changedDimensions.length === 0) {
      res.json({
        success: true,
        hasChanges: false,
        message: '阈值与已发布版本无实际变化',
        data: { ...db.getDraftRule(), thresholds },
        diff,
      })
      return
    }

    const updated = db.updateDraftRule(thresholds, name)
    res.json({
      success: true,
      hasChanges: true,
      data: { ...updated, thresholds: JSON.parse(updated.thresholds) },
      diff,
    })
  } catch (e) {
    console.error('[rules/draft]', (e as Error).message)
    res.status(500).json({ success: false, error: (e as Error).message })
  }
})

export default router
