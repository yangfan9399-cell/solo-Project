import { Router, type Request, type Response } from 'express'
import { blockers } from '../../src/api/data/blockers.js'
import { packages } from '../../src/api/data/packages.js'
import { auditLogs } from '../../src/api/data/audit-logs.js'
import { ReleaseStatus } from '../../src/shared/types.js'
import type { BlockerItem, AuditLog } from '../../src/shared/types.js'

const router = Router()

router.get('/packages/:id/blockers', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const status = req.query.status as string
    const severity = req.query.severity as string

    const pkg = packages.find((p) => p.id === id)

    if (!pkg) {
      res.status(404).json({
        success: false,
        error: 'Package not found',
      })
      return
    }

    let result = blockers.filter((b) => b.packageId === id)

    if (status) {
      result = result.filter((b) => b.status === status)
    }

    if (severity) {
      result = result.filter((b) => b.severity === severity)
    }

    const stats = {
      total: result.length,
      open: result.filter((b) => b.status === 'open').length,
      resolved: result.filter((b) => b.status === 'resolved').length,
      high: result.filter((b) => b.severity === 'high' && b.status === 'open').length,
      medium: result.filter((b) => b.severity === 'medium' && b.status === 'open').length,
      low: result.filter((b) => b.severity === 'low' && b.status === 'open').length,
    }

    res.status(200).json({
      success: true,
      data: {
        blockers: result,
        stats,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blockers',
    })
  }
})

router.post('/blockers/:id/resolve', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { resolution, operator } = req.body as {
      resolution?: string
      operator?: string
    }

    const blockerIndex = blockers.findIndex((b) => b.id === id)

    if (blockerIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Blocker not found',
      })
      return
    }

    const blocker = blockers[blockerIndex]

    if (blocker.status === 'resolved') {
      res.status(400).json({
        success: false,
        error: 'Blocker is already resolved',
      })
      return
    }

    const now = new Date().toISOString()

    const updatedBlocker: BlockerItem = {
      ...blocker,
      status: 'resolved',
      resolvedAt: now,
      resolution: resolution || '已解决',
    }
    blockers[blockerIndex] = updatedBlocker

    const openBlockers = blockers.filter(
      (b) => b.packageId === blocker.packageId && b.status === 'open',
    )
    if (openBlockers.length === 0) {
      const pkgIndex = packages.findIndex((p) => p.id === blocker.packageId)
      if (pkgIndex !== -1) {
        const pkg = packages[pkgIndex]
        if (pkg.status === ReleaseStatus.blocked) {
          packages[pkgIndex] = {
            ...pkg,
            status: ReleaseStatus.pending,
            updatedAt: now,
          }
        }
      }
    }

    const auditLog: AuditLog = {
      id: `log-${Date.now()}`,
      packageId: blocker.packageId,
      action: '阻断项解决',
      description: `${blocker.title} 已解决`,
      operator: operator || '系统',
      timestamp: now,
      details: {
        blockerId: id,
        resolution: resolution || '已解决',
      },
    }
    auditLogs.push(auditLog)

    res.status(200).json({
      success: true,
      data: updatedBlocker,
      message: 'Blocker resolved successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to resolve blocker',
    })
  }
})

export default router
