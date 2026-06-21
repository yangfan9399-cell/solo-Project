import { Router, type Request, type Response } from 'express'
import * as db from '../db.js'
import { computeImpact, type Thresholds } from '../thresholdEngine.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const approvals = db.getApprovals()
  const result = approvals.map(a => ({
    ...a,
    impact_summary: JSON.parse(a.impact_summary),
    threshold_diff: JSON.parse(a.threshold_diff),
  })).sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))
  res.json({ success: true, data: result })
})

router.post('/', (req: Request, res: Response): void => {
  const { reason } = req.body
  if (!reason) {
    res.status(400).json({ success: false, error: 'reason is required' })
    return
  }

  const draft = db.getDraftRule()
  if (!draft) {
    res.status(404).json({ success: false, error: 'No draft rule found' })
    return
  }

  const published = db.getLatestPublishedRule()
  if (!published) {
    res.status(404).json({ success: false, error: 'No published rule found' })
    return
  }

  const oldThresholds: Thresholds = JSON.parse(published.thresholds)
  const newThresholds: Thresholds = JSON.parse(draft.thresholds)
  const specimens = db.getSpecimens()
  const impact = computeImpact(specimens, oldThresholds, newThresholds)

  const impactSummary = {
    toWarn: impact.filter(i => i.newStatus === 'warn').length,
    toBlock: impact.filter(i => i.newStatus === 'block' && i.oldStatus === 'pass').length,
    warnToBlock: impact.filter(i => i.newStatus === 'block' && i.oldStatus === 'warn').length,
    total: impact.length,
  }

  const thresholdDiff = {
    from: published.version,
    to: draft.version,
    changes: {
      altitude: {
        passMax: `${oldThresholds.altitude.passMax}→${newThresholds.altitude.passMax}`,
        warnMax: `${oldThresholds.altitude.warnMax}→${newThresholds.altitude.warnMax}`,
      },
      substrate: {
        passMax: `${oldThresholds.substrate.passMax}→${newThresholds.substrate.passMax}`,
        warnMax: `${oldThresholds.substrate.warnMax}→${newThresholds.substrate.warnMax}`,
      },
      sporeDensity: {
        passMax: `${oldThresholds.sporeDensity.passMax}→${newThresholds.sporeDensity.passMax}`,
        warnMax: `${oldThresholds.sporeDensity.warnMax}→${newThresholds.sporeDensity.warnMax}`,
      },
      humidityExposure: {
        passMax: `${oldThresholds.humidityExposure.passMax}→${newThresholds.humidityExposure.passMax}`,
        warnMax: `${oldThresholds.humidityExposure.warnMax}→${newThresholds.humidityExposure.warnMax}`,
      },
    },
  }

  const approval = db.createApproval(draft.id, reason, impactSummary, thresholdDiff)

  res.json({
    success: true,
    data: {
      ...approval,
      impact_summary: JSON.parse(approval.impact_summary),
      threshold_diff: JSON.parse(approval.threshold_diff),
    },
  })
})

router.put('/:id/approve', (req: Request, res: Response): void => {
  const { comment } = req.body
  const approval = db.getApprovalById(req.params.id)
  if (!approval) {
    res.status(404).json({ success: false, error: 'Approval not found' })
    return
  }

  if (approval.status !== 'pending') {
    res.status(400).json({ success: false, error: 'Approval is not pending' })
    return
  }

  db.approveApproval(approval.id, comment || '')

  const newRule = db.publishDraftRule()
  const newThresholds: Thresholds = JSON.parse(newRule.thresholds)
  db.updateSpecimenStatuses(newThresholds)

  db.addReleaseHistory(newRule.id, newRule.version, `发布规则 ${newRule.version}`, approval.id)

  res.json({ success: true, data: { message: 'Approval granted, rule published' } })
})

router.put('/:id/reject', (req: Request, res: Response): void => {
  const { comment } = req.body
  const approval = db.getApprovalById(req.params.id)
  if (!approval) {
    res.status(404).json({ success: false, error: 'Approval not found' })
    return
  }

  if (approval.status !== 'pending') {
    res.status(400).json({ success: false, error: 'Approval is not pending' })
    return
  }

  db.rejectApproval(approval.id, comment || '')
  res.json({ success: true, data: { message: 'Approval rejected' } })
})

export default router
