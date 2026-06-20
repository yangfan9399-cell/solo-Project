import { Router, type Request, type Response } from 'express'
import { samples } from '../../src/api/data/samples.js'
import { packages } from '../../src/api/data/packages.js'
import { recalcBatches } from '../../src/api/data/recalc-batches.js'
import { auditLogs } from '../../src/api/data/audit-logs.js'

const router = Router({ mergeParams: true })

router.get('/:id/impact', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const status = req.query.status as string

    const pkg = packages.find((p) => p.id === id)

    if (!pkg) {
      res.status(404).json({
        success: false,
        error: 'Package not found',
      })
      return
    }

    let affectedSamples = samples.filter((s) => s.packageId === id)

    if (status) {
      affectedSamples = affectedSamples.filter((s) => s.status === status)
    }

    const stats = {
      total: affectedSamples.length,
      locked: affectedSamples.filter((s) => s.status === 'locked').length,
      conflict: affectedSamples.filter((s) => s.status === 'conflict').length,
      recalc_needed: affectedSamples.filter((s) => s.status === 'recalc_needed').length,
      normal: affectedSamples.filter((s) => s.status === 'normal').length,
    }

    const batches = recalcBatches.filter((b) => b.packageId === id)
    const lockedSampleIds = affectedSamples.filter((s) => s.status === 'locked').map((s) => s.id)
    const conflictSampleIds = affectedSamples.filter((s) => s.status === 'conflict').map((s) => s.id)

    auditLogs.push({
      id: `log-impact-${Date.now()}`,
      packageId: id,
      action: '影响分析查询',
      description: `查询发布包【${pkg.name}】发布影响明细（${status || '全部状态'}）`,
      operator: '系统用户',
      timestamp: new Date().toISOString(),
      details: {
        stats,
        recalcBatchCount: batches.length,
        statusFilter: status || 'all'
      }
    })

    res.status(200).json({
      success: true,
      data: {
        samples: affectedSamples,
        stats,
        recalcBatches: batches,
        lockedSampleIds,
        conflictSampleIds,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch impact details',
    })
  }
})

export default router
