import { Router, type Request, type Response } from 'express'
import * as db from '../db.js'
import { computeImpact, type Thresholds, type ImpactResult } from '../thresholdEngine.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  try {
    const approvals = db.getApprovals()
    const rules = db.getRules()
    const ruleMap = new Map(rules.map(r => [r.id, r]))

    const result = approvals
      .map(a => {
        const rule = ruleMap.get(a.rule_id)
        return {
          ...a,
          impact_summary: JSON.parse(a.impact_summary || '{}'),
          threshold_diff: JSON.parse(a.threshold_diff || '{}'),
          rule_version: a.rule_version_snapshot || rule?.version || null,
          rule_name: a.rule_name_snapshot || rule?.name || null,
        }
      })
      .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))

    res.json({ success: true, data: result })
  } catch (e) {
    console.error('[approvals/list]', (e as Error).message)
    res.status(500).json({ success: false, error: (e as Error).message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { reason } = req.body
    if (!reason || !reason.trim()) {
      res.status(400).json({ success: false, error: '必须写明变更理由才能提交审批' })
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

    const thresholdDiff = db.computeThresholdDiff(oldThresholds, newThresholds)
    if (thresholdDiff.changedDimensions.length === 0) {
      res.status(400).json({
        success: false,
        error: '提交的阈值与已发布版本无任何实际变化，请先调整阈值',
      })
      return
    }

    const specimens = db.getSpecimens()
    const impact: ImpactResult[] = computeImpact(specimens, oldThresholds, newThresholds)
    const enhancedSummary = db.computeEnhancedImpactSummary(impact)

    const changesWithDims: Record<string, any> = {}
    for (const d of thresholdDiff.changedDimensions) {
      const detail = thresholdDiff.detail[d]
      changesWithDims[d] = {
        passMax: detail.passMax ? `${detail.passMax.from}→${detail.passMax.to}` : '不变',
        warnMax: detail.warnMax ? `${detail.warnMax.from}→${detail.warnMax.to}` : '不变',
      }
    }

    const thresholdDiffForRecord = {
      from: published.version,
      to: draft.version,
      changedDimensions: thresholdDiff.changedDimensions,
      changes: changesWithDims,
    }

    const approval = db.createApproval(
      draft.id,
      draft.name,
      draft.version,
      reason.trim(),
      enhancedSummary,
      thresholdDiffForRecord,
    )

    res.json({
      success: true,
      data: {
        ...approval,
        impact_summary: JSON.parse(approval.impact_summary),
        threshold_diff: JSON.parse(approval.threshold_diff),
      },
    })
  } catch (e) {
    console.error('[approvals/create]', (e as Error).message)
    res.status(500).json({ success: false, error: (e as Error).message })
  }
})

router.put('/:id/approve', (req: Request, res: Response): void => {
  try {
    const { comment } = req.body
    const approval = db.getApprovalById(req.params.id)
    if (!approval) {
      res.status(404).json({ success: false, error: 'Approval not found' })
      return
    }

    if (approval.status !== 'pending') {
      res.status(400).json({ success: false, error: `该审批已${approval.status === 'approved' ? '通过' : '驳回'}` })
      return
    }

    const rule = db.getRuleById(approval.rule_id)
    if (!rule) {
      res.status(404).json({ success: false, error: '关联的规则不存在' })
      return
    }

    const approved = db.approveApproval(approval.id, comment || '')
    let newRule = db.getRuleById(rule.id)

    if (rule.status === 'draft') {
      newRule = db.publishDraftRule()
      const newThresholds: Thresholds = JSON.parse(newRule.thresholds)
      db.updateSpecimenStatuses(newThresholds)

      const summary = JSON.parse(approved.impact_summary || '{}')
      const changeSummary = `发布规则 ${newRule.version}：影响 ${summary.total || 0} 个标本（→警告:${summary.toWarn || 0}, →阻断:${summary.toBlock || 0}, 警告→阻断:${summary.warnToBlock || 0}）`
      db.addReleaseHistory(newRule.id, newRule.name, newRule.version, changeSummary, approval.id)
    }

    res.json({
      success: true,
      data: {
        message: '审批通过',
        ruleVersion: newRule?.version,
      },
    })
  } catch (e) {
    console.error('[approvals/approve]', (e as Error).message)
    res.status(500).json({ success: false, error: (e as Error).message })
  }
})

router.put('/:id/reject', (req: Request, res: Response): void => {
  try {
    const { comment } = req.body
    const approval = db.getApprovalById(req.params.id)
    if (!approval) {
      res.status(404).json({ success: false, error: 'Approval not found' })
      return
    }

    if (approval.status !== 'pending') {
      res.status(400).json({ success: false, error: `该审批已${approval.status === 'approved' ? '通过' : '驳回'}` })
      return
    }

    if (!comment || !comment.trim()) {
      res.status(400).json({ success: false, error: '驳回必须填写审批意见' })
      return
    }

    const rejected = db.rejectApproval(approval.id, comment.trim())
    res.json({
      success: true,
      data: {
        message: '审批驳回',
        rejected,
      },
    })
  } catch (e) {
    console.error('[approvals/reject]', (e as Error).message)
    res.status(500).json({ success: false, error: (e as Error).message })
  }
})

export default router
