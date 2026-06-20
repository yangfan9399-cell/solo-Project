import { Router, type Request, type Response } from 'express'
import { samples } from '../../src/api/data/samples.js'
import { packages } from '../../src/api/data/packages.js'

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

    res.status(200).json({
      success: true,
      data: {
        samples: affectedSamples,
        stats,
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
