import { Router, type Request, type Response } from 'express'
import * as db from '../db.js'
import { computeImpact, type Thresholds, type ImpactResult } from '../thresholdEngine.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  try {
    const published = db.getLatestPublishedRule()
    const draft = db.getDraftRule()

    if (!published || !draft) {
      res.json({ success: true, data: [], meta: { crossSeasonPairs: [] } })
      return
    }

    const oldThresholds: Thresholds = JSON.parse(published.thresholds)
    const newThresholds: Thresholds = JSON.parse(draft.thresholds)
    const specimens = db.getSpecimens()

    const impact: ImpactResult[] = computeImpact(specimens, oldThresholds, newThresholds)
    const enhancedSummary = db.computeEnhancedImpactSummary(impact)

    const specimensById = new Map(specimens.map(s => [s.id, s]))
    const enriched = impact.map(imp => {
      let pairInfo = null
      if (imp.isCrossSeason && imp.specimen.linked_specimen_id) {
        const linked = specimensById.get(imp.specimen.linked_specimen_id)
        if (linked) {
          pairInfo = {
            pair_id: [imp.specimen.id, imp.specimen.linked_specimen_id].sort().join('|'),
            linked_code: linked.code,
            linked_season: linked.season,
            linked_status: linked.current_status,
            linked_collection_point: linked.collection_point,
          }
        }
      }
      return {
        ...imp,
        pair_info: pairInfo,
      }
    })

    res.json({
      success: true,
      data: enriched,
      meta: {
        crossSeasonPairs: enhancedSummary.crossSeasonPairs,
        byDimension: enhancedSummary.byDimension,
        crossSeasonAffected: enhancedSummary.crossSeasonAffected,
      },
    })
  } catch (e) {
    console.error('[impact/list]', (e as Error).message)
    res.status(500).json({ success: false, error: (e as Error).message })
  }
})

router.get('/summary', (_req: Request, res: Response): void => {
  try {
    const published = db.getLatestPublishedRule()
    const draft = db.getDraftRule()

    if (!published || !draft) {
      res.json({
        success: true,
        data: {
          toWarn: 0, toBlock: 0, warnToBlock: 0, total: 0,
          crossSeasonAffected: 0, crossSeasonPairs: [], byDimension: {},
        },
      })
      return
    }

    const oldThresholds: Thresholds = JSON.parse(published.thresholds)
    const newThresholds: Thresholds = JSON.parse(draft.thresholds)
    const specimens = db.getSpecimens()

    const impact = computeImpact(specimens, oldThresholds, newThresholds)
    const summary = db.computeEnhancedImpactSummary(impact)
    const diff = db.computeThresholdDiff(oldThresholds, newThresholds)

    res.json({
      success: true,
      data: summary,
      thresholdDiff: diff,
    })
  } catch (e) {
    console.error('[impact/summary]', (e as Error).message)
    res.status(500).json({ success: false, error: (e as Error).message })
  }
})

export default router
