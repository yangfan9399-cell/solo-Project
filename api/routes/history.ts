import { Router, type Request, type Response } from 'express'
import * as db from '../db.js'
import { computeImpact, type Thresholds } from '../thresholdEngine.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  try {
    const history = db.getReleaseHistory()
    const rules = db.getRules()
    const ruleMap = new Map(rules.map(r => [r.id, r]))
    const result = [...history]
      .map(h => {
        const rule = ruleMap.get(h.rule_id)
        const ruleName = h.rule_name_snapshot && h.rule_name_snapshot.trim()
          ? h.rule_name_snapshot
          : rule?.name || `地衣标本采集阈值规则 ${h.version}`
        return {
          ...h,
          rule_name: ruleName,
        }
      })
      .sort((a, b) => b.published_at.localeCompare(a.published_at))
    res.json({ success: true, data: result })
  } catch (e) {
    console.error('[history/list]', (e as Error).message)
    res.status(500).json({ success: false, error: (e as Error).message })
  }
})

router.post('/rollback', (req: Request, res: Response): void => {
  const { targetRuleId } = req.body
  if (!targetRuleId) {
    res.status(400).json({ success: false, error: 'targetRuleId is required' })
    return
  }

  const targetRule = db.getRuleById(targetRuleId)
  if (!targetRule) {
    res.status(404).json({ success: false, error: 'Target rule not found' })
    return
  }

  const published = db.getLatestPublishedRule()
  if (!published) {
    res.status(404).json({ success: false, error: 'No published rule found' })
    return
  }

  const currentThresholds: Thresholds = JSON.parse(published.thresholds)
  const targetThresholds: Thresholds = JSON.parse(targetRule.thresholds)
  const specimens = db.getSpecimens()
  const impact = computeImpact(specimens, currentThresholds, targetThresholds)

  const impactSummary = {
    toWarn: impact.filter(i => i.newStatus === 'warn').length,
    toBlock: impact.filter(i => i.newStatus === 'block' && i.oldStatus === 'pass').length,
    warnToBlock: impact.filter(i => i.newStatus === 'block' && i.oldStatus === 'warn').length,
    total: impact.length,
  }

  const rollback = db.createRollbackDraft(targetRuleId, targetRule.version, impactSummary)

  res.json({
    success: true,
    data: { ...rollback, impact_summary: JSON.parse(rollback.impact_summary) },
  })
})

router.get('/rollback-drafts', (_req: Request, res: Response): void => {
  const drafts = db.getRollbackDrafts()
  const result = drafts.map(d => ({
    ...d,
    impact_summary: JSON.parse(d.impact_summary),
  })).sort((a, b) => b.created_at.localeCompare(a.created_at))
  res.json({ success: true, data: result })
})

router.post('/rollback/:id/submit', (req: Request, res: Response): void => {
  const rollback = db.getRollbackDraftById(req.params.id)
  if (!rollback) {
    res.status(404).json({ success: false, error: 'Rollback draft not found' })
    return
  }

  if (rollback.status !== 'draft') {
    res.status(400).json({ success: false, error: 'Rollback draft is not in draft status' })
    return
  }

  const updated = db.updateRollbackDraftStatus(rollback.id, 'approved')

  res.json({
    success: true,
    data: { ...updated, impact_summary: JSON.parse(updated.impact_summary) },
  })
})

router.post('/rollback/:id/execute', (req: Request, res: Response): void => {
  const { comment } = req.body
  const rollback = db.getRollbackDraftById(req.params.id)
  if (!rollback) {
    res.status(404).json({ success: false, error: 'Rollback draft not found' })
    return
  }

  if (rollback.status !== 'approved') {
    res.status(400).json({ success: false, error: 'Rollback draft must be approved before execution' })
    return
  }

  const targetRule = db.getRuleById(rollback.target_rule_id)
  if (!targetRule) {
    res.status(404).json({ success: false, error: 'Target rule not found' })
    return
  }

  const targetThresholds: Thresholds = JSON.parse(targetRule.thresholds)
  db.updateSpecimenStatuses(targetThresholds)

  const newRule = db.addPublishedRule(targetRule.name, targetRule.version, targetRule.thresholds)

  const approval = db.createApproval(
    newRule.id,
    newRule.name,
    newRule.version,
    `回滚至规则 ${rollback.target_version}`,
    JSON.parse(rollback.impact_summary),
    {
      from: 'current',
      to: rollback.target_version,
    },
  )
  db.approveApproval(approval.id, comment || '执行回滚')

  db.addReleaseHistory(newRule.id, newRule.name, rollback.target_version, `回滚至规则 ${rollback.target_version}`, approval.id)

  res.json({ success: true, data: { message: `Rollback to ${rollback.target_version} executed successfully` } })
})

export default router
